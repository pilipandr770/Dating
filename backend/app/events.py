from flask_socketio import emit, join_room, leave_room

def init_socketio_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')
        emit('connection_response', {'data': 'Connected'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')
