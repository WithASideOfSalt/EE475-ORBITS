
import time
from flask import Flask, request
from flask_socketio import SocketIO, emit
import paho.mqtt.client as mqtt
import json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="gevent")

# MQTT Client Setup to communicate with ESP32
mqtt_client = mqtt.Client()


def on_mqtt_connect(client, userdata, flags, rc):
    print("Connected to MQTT Broker with result code " + str(rc))
    #Subscribe to all "orbits" related topics
    client.subscribe("orbits/#")

def on_mqtt_message(client, userdata, msg):
    print(f"Received MQTT message on topic {msg.topic}: {msg.payload.decode()}")
    # Broadcast the received MQTT message to all connected SocketIO clients
    if 'imu' in msg.topic:
        try:
            payload = json.loads(msg.payload.decode())
            socketio.emit('imu_data', {
                'accel_x': payload.get('accel_x', 0),
                'accel_y': payload.get('accel_y', 0),
                'accel_z': payload.get('accel_z', 0),
                'gyro_x': payload.get('gyro_x', 0),
                'gyro_y': payload.get('gyro_y', 0),
                'gyro_z': payload.get('gyro_z', 0),
                'timestamp': time.time()
            })
        except json.JSONDecodeError:
            print(f"Failed to parse JSON from topic {msg.topic}")

mqtt_client.on_connect = on_mqtt_connect
mqtt_client.on_message = on_mqtt_message
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