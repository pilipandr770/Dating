import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///dating.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    STRIPE_API_KEY = os.getenv('STRIPE_API_KEY')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

    SUBSCRIPTION_PLANS = {
        'free': {'name': 'Free', 'price': 0, 'ai_assistant': False, 'cinema': False, 'booking': False, 'max_matches': 10},
        'standard': {'name': 'Standard', 'price': 9.99, 'ai_assistant': True, 'cinema': True, 'booking': False, 'max_matches': 50},
        'premium': {'name': 'Premium', 'price': 19.99, 'ai_assistant': True, 'cinema': True, 'booking': True, 'max_matches': -1}
    }

config = {'development': Config, 'default': Config}
