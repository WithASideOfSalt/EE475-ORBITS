import time
from flask import Flask, request
from flask_socketio import SocketIO, emit
import threading
import time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/api/time')
def get_current_time():
    return {'time': time.time()}

@socketio.on('connect')
def handle_connet():
    #client connected for full duplex comms
    print("A Connection has been made")
    emit('status', {"message": 'Connected to ORBITS ground station'})

def broadcast_time():
    #Get live updates on the front end for the current time
    while(True):
        socketio.emit('time_update', {
            'timestamp': time.time()
        })

        time.sleep(0.5)

threading.Thread(target=broadcast_time, daemon=True).start()