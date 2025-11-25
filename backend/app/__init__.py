from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from config import config
from app.models import db
import os

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio = SocketIO(app, cors_allowed_origins="*")

    # Register blueprints
    from app.routes import auth_bp, user_bp, match_bp, chat_bp, payment_bp, video_bp
    from app.routes.admin import admin_bp
    from app.routes.movie import movie_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(match_bp, url_prefix='/api/match')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')
    app.register_blueprint(video_bp, url_prefix='/api/video')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(movie_bp, url_prefix='/api/movie')

    with app.app_context():
        # Create schema if using PostgreSQL
        if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI']:
            schema_name = app.config.get('DATABASE_SCHEMA', 'public')
            try:
                db.session.execute(db.text(f'CREATE SCHEMA IF NOT EXISTS {schema_name}'))
                db.session.commit()
                print(f'Schema "{schema_name}" created or already exists')
            except Exception as e:
                print(f'Note: Schema creation: {e}')
                db.session.rollback()

        # Create all tables
        db.create_all()
        print('Database tables created')

    return app, socketio
