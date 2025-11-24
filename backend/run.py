import os
from dotenv import load_dotenv
from app import create_app

load_dotenv()

app, socketio = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    print("Backend starting on http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
