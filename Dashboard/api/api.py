
import csv
import io
import json
import os
import shlex
import subprocess
import time
from pathlib import Path
from threading import Lock

from flask import Flask, Response, jsonify, request
from flask_socketio import SocketIO, emit
import paho.mqtt.client as mqtt
import mysql.connector

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="gevent")

# Define paths for PlatformIO project and environment variables
REPO_ROOT = Path(__file__).resolve().parents[2]
PIO_PROJECT_DIR = Path(os.getenv("PIO_PROJECT_DIR", str(REPO_ROOT / "ORBITS" / "pio"))).resolve()
PIO_MAIN_CPP = PIO_PROJECT_DIR / "src" / "main.cpp"
ENV_FILE = Path(__file__).resolve().parent / ".env"
TMUX_SOCKET = os.getenv("API_TMUX_SOCKET", "/tmp/tmux-APIService")
PLATFORMIO_TMUX_SESSION = os.getenv("PLATFORMIO_TMUX_SESSION", "platformIO")


def load_local_env(env_path):
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_local_env(ENV_FILE)

MYSQL_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "orbitsground"),
    "password": os.getenv("MYSQL_PASSWORD", "orbitsground"),
    "database": os.getenv("MYSQL_DATABASE", "ORBITS"),
}

UPLOAD_STATE_LOCK = Lock()
ACTIVE_UPLOADS = 0


def begin_upload():
    global ACTIVE_UPLOADS
    with UPLOAD_STATE_LOCK:
        ACTIVE_UPLOADS += 1


def end_upload():
    global ACTIVE_UPLOADS
    with UPLOAD_STATE_LOCK:
        ACTIVE_UPLOADS = max(0, ACTIVE_UPLOADS - 1)


def upload_in_progress():
    with UPLOAD_STATE_LOCK:
        return ACTIVE_UPLOADS > 0


def get_db_connection():
    return mysql.connector.connect(**MYSQL_CONFIG)


def to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def get_payload_timestamp(payload_data):
    if isinstance(payload_data, dict):
        value = payload_data.get("timestamp")
        if isinstance(value, (int, float)):
            return float(value)
    return time.time()


def init_db():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS system_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mission_id VARCHAR(128) NOT NULL,
                event_type VARCHAR(128) NOT NULL,
                description TEXT,
                timestamp DOUBLE NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS telemetry_updates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mission_id VARCHAR(128) NOT NULL,
                voltage DOUBLE,
                current DOUBLE,
                power DOUBLE,
                timestamp DOUBLE NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS adcs_updates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mission_id VARCHAR(128) NOT NULL,
                accel_x DOUBLE,
                accel_y DOUBLE,
                accel_z DOUBLE,
                gyro_x DOUBLE,
                gyro_y DOUBLE,
                gyro_z DOUBLE,
                mag_x DOUBLE,
                mag_y DOUBLE,
                mag_z DOUBLE,
                timestamp DOUBLE NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def persist_system_event(payload_data):
    if not isinstance(payload_data, dict):
        return
    if upload_in_progress():
        print("Skipping system event DB insert while PlatformIO upload is running")
        return

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO system_events (mission_id, event_type, description, timestamp)
            VALUES (%s, %s, %s, %s)
            """,
            (
                payload_data.get("mission_id", "default_mission"),
                payload_data.get("event_type", "general"),
                payload_data.get("description", ""),
                get_payload_timestamp(payload_data),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def persist_telemetry_update(payload_data):
    if not isinstance(payload_data, dict):
        return
    if upload_in_progress():
        print("Skipping telemetry DB insert while PlatformIO upload is running")
        return
    print(payload_data)
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO telemetry_updates (mission_id, voltage, current, power, timestamp)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                payload_data.get("mission_id", "default_mission"),
                to_float(payload_data.get("bus_voltage_v"), None),
                to_float(payload_data.get("current_ma"), None),
                to_float(payload_data.get("power_mw"), None),
                get_payload_timestamp(payload_data),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def persist_adcs_update(payload_data):
    if not isinstance(payload_data, dict):
        return
    if upload_in_progress():
        print("Skipping ADCS DB insert while PlatformIO upload is running")
        return

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO adcs_updates (
                mission_id,
                accel_x,
                accel_y,
                accel_z,
                gyro_x,
                gyro_y,
                gyro_z,
                mag_x,
                mag_y,
                mag_z,
                timestamp
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload_data.get("mission_id", "default_mission"),
                to_float(payload_data.get("accel_x"), None),
                to_float(payload_data.get("accel_y"), None),
                to_float(payload_data.get("accel_z"), None),
                to_float(payload_data.get("gyro_x"), None),
                to_float(payload_data.get("gyro_y"), None),
                to_float(payload_data.get("gyro_z"), None),
                to_float(payload_data.get("mag_x"), None),
                to_float(payload_data.get("mag_y"), None),
                to_float(payload_data.get("mag_z"), None),
                get_payload_timestamp(payload_data),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def persist_mqtt_message(topic, payload_data):
    topic_lower = topic.lower()

    if any(part in topic_lower for part in ["event", "events", "system"]):
        persist_system_event(payload_data)
        socketio.emit('system_event', payload_data)
        return

    if any(part in topic_lower for part in ["telemetry", "power"]):
        persist_telemetry_update(payload_data)
        socketio.emit('telemetry_update', payload_data)
        return

    if any(part in topic_lower for part in ["adcs", "imu"]):
        persist_adcs_update(payload_data)
        socketio.emit('adcs_update', payload_data)
        print("Sending IMU data via socketio")

        return


def run_platformio_upload(project_dir):
    commands = []
    if os.name == "nt":
        commands.extend([
            ["pio", "run", "-t", "upload"],
            ["platformio", "run", "-t", "upload"],
        ])
    else:
        commands.extend([
            ["platformio", "run", "-t", "upload"],
            ["pio", "run", "-t", "upload"],
        ])

    last_error = None
    for command in commands:
        try:
            print(f"Running PlatformIO command in dedicated tmux session: {' '.join(command)} (cwd={project_dir})")

            window_name = "platformIO"
            target = f"{PLATFORMIO_TMUX_SESSION}:{window_name}"
            tmux_prefix = ["tmux", "-S", TMUX_SOCKET]

            subprocess.run(
                tmux_prefix + ["kill-session", "-t", PLATFORMIO_TMUX_SESSION],
                capture_output=True,
                text=True,
                check=False,
            )

            shell_command = (
                f"cd {shlex.quote(str(project_dir))} && "
                f"{' '.join(command)} ; "
                "printf '\n__PIO_EXIT_CODE__:%s\n' \"$?\""
            )
            new_session = subprocess.run(
                tmux_prefix + ["new-session", "-d", "-s", PLATFORMIO_TMUX_SESSION, "-n", window_name, shell_command],
                capture_output=True,
                text=True,
                check=False,
            )
            if new_session.returncode != 0:
                raise subprocess.CalledProcessError(
                    returncode=new_session.returncode,
                    cmd=new_session.args,
                    output=new_session.stdout,
                    stderr=new_session.stderr,
                )

            deadline = time.time() + 600
            pane_output = ""
            while time.time() < deadline:
                capture = subprocess.run(
                    tmux_prefix + ["capture-pane", "-pt", target],
                    capture_output=True,
                    text=True,
                    check=False,
                )
                pane_output = capture.stdout or ""
                if "__PIO_EXIT_CODE__:" in pane_output:
                    break
                time.sleep(0.5)
            else:
                raise subprocess.TimeoutExpired(command, 600)

            marker = "__PIO_EXIT_CODE__:"
            marker_index = pane_output.rfind(marker)
            stdout_text = pane_output[:marker_index].rstrip() if marker_index >= 0 else pane_output.rstrip()
            exit_code = 1
            if marker_index >= 0:
                exit_line = pane_output[marker_index + len(marker):].strip().splitlines()
                if exit_line:
                    try:
                        exit_code = int(exit_line[0].strip())
                    except ValueError:
                        exit_code = 1

            result = subprocess.CompletedProcess(
                args=command,
                returncode=exit_code,
                stdout=stdout_text,
                stderr="",
            )

            print(f"PlatformIO command finished with exit code {result.returncode}")
            if result.stdout:
                print("PlatformIO stdout:")
                print(result.stdout)
            if result.stderr:
                print("PlatformIO stderr:")
                print(result.stderr)

            return result
        except FileNotFoundError as exc:
            last_error = exc
        except subprocess.CalledProcessError as exc:
            print(f"Failed to manage tmux session for PlatformIO upload: {exc}")
            result = subprocess.CompletedProcess(
                args=command,
                returncode=1,
                stdout="",
                stderr=str(exc),
            )
            return result

    raise FileNotFoundError("PlatformIO CLI or tmux not found (tried 'pio' and 'platformio').") from last_error


def build_csv_response(filename_prefix, header, rows):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(header)
    writer.writerows(rows)

    timestamp = int(time.time())
    filename = f"{filename_prefix}_{timestamp}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.route('/api/download/telemetry/recent', methods=['GET'])
def download_recent_telemetry():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, mission_id, voltage, current, power, timestamp
            FROM telemetry_updates
            ORDER BY id DESC
            LIMIT 100
            """
        )
        rows = cursor.fetchall()
        return build_csv_response(
            "telemetry_recent_100",
            ["id", "mission_id", "voltage", "current", "power", "timestamp"],
            rows,
        )
    finally:
        conn.close()


@app.route('/api/download/adcs/recent', methods=['GET'])
def download_recent_adcs():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                mission_id,
                accel_x,
                accel_y,
                accel_z,
                gyro_x,
                gyro_y,
                gyro_z,
                mag_x,
                mag_y,
                mag_z,
                timestamp
            FROM adcs_updates
            ORDER BY id DESC
            LIMIT 100
            """
        )
        rows = cursor.fetchall()
        return build_csv_response(
            "adcs_recent_100",
            [
                "id",
                "mission_id",
                "accel_x",
                "accel_y",
                "accel_z",
                "gyro_x",
                "gyro_y",
                "gyro_z",
                "mag_x",
                "mag_y",
                "mag_z",
                "timestamp",
            ],
            rows,
        )
    finally:
        conn.close()


@app.route('/api/command', methods=['POST'])
def publish_dashboard_command():
    body = request.get_json(silent=True) or {}
    topic = body.get('topic', 'orbits/command/user')
    params = body.get('params', {})

    if not isinstance(topic, str) or not topic.strip():
        return jsonify({'ok': False, 'error': 'topic must be a non-empty string.'}), 400

    if not isinstance(params, dict):
        return jsonify({'ok': False, 'error': 'params must be a JSON object.'}), 400

    payload = {
        'mission_id': body.get('mission_id', 'dashboard'),
        'params': params,
        'timestamp': time.time(),
    }

    publish_result = mqtt_client.publish(topic.strip(), json.dumps(payload))
    if publish_result.rc != mqtt.MQTT_ERR_SUCCESS:
        error_message = f'MQTT publish failed with code {publish_result.rc}'
        return jsonify({'ok': False, 'error': error_message}), 500

    response = {
        'ok': True,
        'topic': topic.strip(),
        'payload': payload,
    }
    socketio.emit('command_dispatched', response)
    return jsonify(response), 200

# MQTT Client Setup to communicate with ESP32
mqtt_client = mqtt.Client()


def on_mqtt_connect(client, userdata, flags, rc):
    print("Connected to MQTT Broker with result code " + str(rc))
    #Subscribe to all "orbits" related topics
    client.subscribe("orbits/#")

def on_mqtt_message(client, userdata, msg):
    payload_raw = msg.payload.decode(errors="replace")
    #print(f"Received MQTT message on topic {msg.topic}: {payload_raw}")
    payload_data = None

    try:
        payload_data = json.loads(payload_raw)
        print(f"Payload data decoded")
    except json.JSONDecodeError:
        payload_data = None

    try:
        persist_mqtt_message(msg.topic, payload_data)
    except mysql.connector.Error as exc:
        print(f"Database insert failed for topic {msg.topic}: {exc}")

@app.route('/api/process', methods=['POST'])
def process_code():
    body = request.get_json(silent=True) or {}
    code = body.get('code')
    print(f"Received code for processing: {code[:100]}...")  # Log the first 100 characters for debugging
    if not isinstance(code, str) or not code.strip():
        return jsonify({'ok': False, 'error': 'Request must include a non-empty code string.'}), 400

    print(f"Checking for PlatformIO project at {PIO_PROJECT_DIR} and main.cpp at {PIO_MAIN_CPP}")
    if not PIO_PROJECT_DIR.exists() or not PIO_MAIN_CPP.exists():
        return (
            jsonify(
                {
                    'ok': False,
                    'error': f'PlatformIO project not found at {PIO_PROJECT_DIR}',
                }
            ),
            500,
        )

    PIO_MAIN_CPP.write_text(code, encoding='utf-8')

    try:
        begin_upload()
        result = run_platformio_upload(PIO_PROJECT_DIR)
    except FileNotFoundError as exc:
        response = {
            'ok': False,
            'returncode': 1,
            'stdout': '',
            'stderr': str(exc),
            'error': str(exc),
        }
        socketio.emit('upload_complete', response)
        return jsonify(response), 500
    except subprocess.TimeoutExpired:
        response = {
            'ok': False,
            'returncode': 124,
            'stdout': '',
            'stderr': 'PlatformIO command timed out.',
            'error': 'PlatformIO command timed out.',
        }
        socketio.emit('upload_complete', response)
        return jsonify(response), 504
    finally:
        end_upload()

    response = {
        'ok': result.returncode == 0,
        'returncode': result.returncode,
        'stdout': result.stdout,
        'stderr': result.stderr,
    }

    status_code = 200 if result.returncode == 0 else 500
    socketio.emit('upload_complete', response)
    return jsonify(response), status_code

mqtt_client.on_connect = on_mqtt_connect
mqtt_client.on_message = on_mqtt_message
init_db()
mqtt_client.connect("localhost", 1883, 60)
mqtt_client.loop_start()

@socketio.on('connect')
def handle_connect():
    #client connected for full duplex comms
    print("A Connection has been made")
    emit('status', {"message": 'Connected to ORBITS ground station'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client Disconnected')


def broadcast_time():
    #Get live updates on the front end for the current time
    while(True):
        socketio.emit('time_update', {
            'timestamp': time.time()
        })

        time.sleep(1)

socketio.start_background_task(broadcast_time)

if __name__ == '__main__':
    print('Starting SocketIO')
    socketio.run(app, host='0.0.0.0', port =8000, debug =True)

if __name__ != '__main__':
    print(__name__)
    print('Running under WSGI server')
