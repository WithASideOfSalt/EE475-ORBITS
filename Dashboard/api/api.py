
import json
import os
import subprocess
import time
from pathlib import Path

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import paho.mqtt.client as mqtt
import mysql.connector

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="gevent")

# Define paths for PlatformIO project and environment variables
REPO_ROOT = Path(__file__).resolve().parents[2]
PIO_PROJECT_DIR = Path(os.getenv("PIO_PROJECT_DIR", str(REPO_ROOT / "ORBITS"))).resolve()
PIO_MAIN_CPP = PIO_PROJECT_DIR / "src" / "main.cpp"
ENV_FILE = Path(__file__).resolve().parent / ".env"


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

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO SystemEvents (mission_id, event_type, description, timestamp)
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

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO TelemetryUpdates (mission_id, voltage, current, power, timestamp)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                payload_data.get("mission_id", "default_mission"),
                to_float(payload_data.get("voltage"), None),
                to_float(payload_data.get("current"), None),
                to_float(payload_data.get("power"), None),
                get_payload_timestamp(payload_data),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def persist_adcs_update(payload_data):
    if not isinstance(payload_data, dict):
        return

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO ADCS_data (
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
            result = subprocess.run(
                command,
                cwd=project_dir,
                capture_output=True,
                text=True,
                timeout=600,
                check=False,
            )
            return result
        except FileNotFoundError as exc:
            last_error = exc

    raise FileNotFoundError("PlatformIO CLI not found (tried 'pio' and 'platformio').") from last_error

# MQTT Client Setup to communicate with ESP32
mqtt_client = mqtt.Client()


def on_mqtt_connect(client, userdata, flags, rc):
    print("Connected to MQTT Broker with result code " + str(rc))
    #Subscribe to all "orbits" related topics
    client.subscribe("orbits/#")

def on_mqtt_message(client, userdata, msg):
    payload_raw = msg.payload.decode(errors="replace")
    print(f"Received MQTT message on topic {msg.topic}: {payload_raw}")
    payload_data = None

    try:
        payload_data = json.loads(payload_raw)
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

    if not isinstance(code, str) or not code.strip():
        return jsonify({'ok': False, 'error': 'Request must include a non-empty code string.'}), 400

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
        result = run_platformio_upload(PIO_PROJECT_DIR)
    except FileNotFoundError as exc:
        return jsonify({'ok': False, 'error': str(exc)}), 500
    except subprocess.TimeoutExpired:
        return jsonify({'ok': False, 'error': 'PlatformIO command timed out.'}), 504

    response = {
        'ok': result.returncode == 0,
        'returncode': result.returncode,
        'stdout': result.stdout,
        'stderr': result.stderr,
    }

    status_code = 200 if result.returncode == 0 else 500
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

        time.sleep(0.5)

socketio.start_background_task(broadcast_time)

if __name__ == '__main__':
    print('Starting SocketIO')
    socketio.run(app, host='0.0.0.0', port =8000, debug =True)

if __name__ != '__main__':
    print(__name__)
    print('Running under WSGI server')