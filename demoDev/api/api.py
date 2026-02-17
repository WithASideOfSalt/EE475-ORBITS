
import time
from flask import Flask, request
from flask_socketio import SocketIO, emit
import paho.mqtt.client as mqtt
import threading

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="gevent")

# MQTT Client Setup to communicate with ESP32
mqtt_client = mqtt.Client()

@socketio.on('connect')
def handle_connet():
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