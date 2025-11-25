from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid
import os

db = SQLAlchemy()

# Get schema from environment
SCHEMA = os.getenv('DATABASE_SCHEMA', 'public')

class User(db.Model):
    __tablename__ = 'users'
    __table_args__ = {'schema': SCHEMA} if 'postgresql' in os.getenv('DATABASE_URL', '') else {}

    # Basic Info
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(80))
    last_name = db.Column(db.String(80))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    city = db.Column(db.String(120))
    bio = db.Column(db.Text)
    photos = db.Column(db.JSON, default=list)

    # Extended Profile Info
    height = db.Column(db.Integer)  # in cm
    weight = db.Column(db.Integer)  # in kg
    body_type = db.Column(db.String(30))  # slim, athletic, average, curvy, plus_size
    hair_color = db.Column(db.String(30))
    eye_color = db.Column(db.String(30))
    zodiac_sign = db.Column(db.String(20))
    education = db.Column(db.String(50))  # high_school, bachelor, master, phd
    occupation = db.Column(db.String(100))
    company = db.Column(db.String(100))
    languages = db.Column(db.JSON, default=list)  # ["Russian", "English", "German"]
    
    # Lifestyle
    smoking = db.Column(db.String(20))  # never, sometimes, regularly
    drinking = db.Column(db.String(20))  # never, socially, regularly
    children = db.Column(db.String(30))  # no, yes_living_together, yes_living_separately, want_someday
    
    # Interests (stored as JSON array)
    interests = db.Column(db.JSON, default=list)  # ["travel", "music", "sport", "art", ...]
    
    # Looking for (detailed)
    relationship_type = db.Column(db.String(30))  # serious, casual, friendship, not_sure

    # Goal Type: relationship, friendship, intimate_services, casual
    goal = db.Column(db.String(30), nullable=False)

    # Subscription: free, standard, premium
    subscription_plan = db.Column(db.String(20), default='free')
    subscription_expires = db.Column(db.DateTime)
    stripe_customer_id = db.Column(db.String(100))
    stripe_subscription_id = db.Column(db.String(100))

    # Service Provider Specific (for intimate_services)
    is_service_provider = db.Column(db.Boolean, default=False)
    service_verified = db.Column(db.Boolean, default=False)
    business_name = db.Column(db.String(200))
    tax_id = db.Column(db.String(255))  # Now stores provider's Stripe Secret Key (increased to 255)
    stripe_account_id = db.Column(db.String(100))  # Extracted from Stripe API
    hourly_rate = db.Column(db.Float)
    services_offered = db.Column(db.JSON, default=list)

    # AI Assistant Settings
    ai_assistant_enabled = db.Column(db.Boolean, default=False)
    ai_chat_analysis = db.Column(db.Boolean, default=True)
    ai_fraud_detection = db.Column(db.Boolean, default=True)

    # Safety & Verification
    email_verified = db.Column(db.Boolean, default=False)
    phone_verified = db.Column(db.Boolean, default=False)
    id_verified = db.Column(db.Boolean, default=False)
    trust_score = db.Column(db.Integer, default=50)
    warnings_count = db.Column(db.Integer, default=0)
    
    # Stripe Identity Verification (18+ Age Verification)
    identity_verified = db.Column(db.Boolean, default=False)
    identity_verification_status = db.Column(db.String(30), default='unverified')  # unverified, pending, verified, failed
    stripe_identity_session_id = db.Column(db.String(100))
    identity_verified_at = db.Column(db.DateTime)
    identity_document_type = db.Column(db.String(30))  # passport, id_card, driving_license
    identity_age_verified = db.Column(db.Boolean, default=False)  # Confirms 18+
    verification_attempts = db.Column(db.Integer, default=0)
    last_verification_attempt = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    is_banned = db.Column(db.Boolean, default=False)
    banned_reason = db.Column(db.Text)
    is_admin = db.Column(db.Boolean, default=False)

    # Preferences
    looking_for_gender = db.Column(db.String(20))
    age_min = db.Column(db.Integer)
    age_max = db.Column(db.Integer)
    max_distance = db.Column(db.Integer, default=50)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Match(db.Model):
    __tablename__ = 'matches'
    __table_args__ = {'schema': SCHEMA} if 'postgresql' in os.getenv('DATABASE_URL', '') else {}
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = db.Column(db.String(36), db.ForeignKey(f'{SCHEMA}.users.id' if 'postgresql' in os.getenv('DATABASE_URL', '') else 'users.id'))
    receiver_id = db.Column(db.String(36), db.ForeignKey(f'{SCHEMA}.users.id' if 'postgresql' in os.getenv('DATABASE_URL', '') else 'users.id'))
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Chat(db.Model):
    __tablename__ = 'chats'
    __table_args__ = {'schema': SCHEMA} if 'postgresql' in os.getenv('DATABASE_URL', '') else {}
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = db.Column(db.String(36), db.ForeignKey(f'{SCHEMA}.matches.id' if 'postgresql' in os.getenv('DATABASE_URL', '') else 'matches.id'))
    message = db.Column(db.Text)
    sender_id = db.Column(db.String(36), db.ForeignKey(f'{SCHEMA}.users.id' if 'postgresql' in os.getenv('DATABASE_URL', '') else 'users.id'))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MovieSession(db.Model):
    __tablename__ = 'movie_sessions'
    __table_args__ = {'schema': SCHEMA} if 'postgresql' in os.getenv('DATABASE_URL', '') else {}
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = db.Column(db.String(36), db.ForeignKey(f'{SCHEMA}.matches.id' if 'postgresql' in os.getenv('DATABASE_URL', '') else 'matches.id'))
    movie_title = db.Column(db.String(200))
    movie_url = db.Column(db.String(500))  # YouTube URL or file path
    movie_thumbnail = db.Column(db.String(500))
    status = db.Column(db.String(20), default='selecting')  # selecting, playing, paused, ended
    current_time = db.Column(db.Float, default=0.0)  # Current playback position in seconds
    started_by = db.Column(db.String(36), db.ForeignKey(f'{SCHEMA}.users.id' if 'postgresql' in os.getenv('DATABASE_URL', '') else 'users.id'))
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Booking(db.Model):
    __tablename__ = 'bookings'
    __table_args__ = {'schema': SCHEMA} if 'postgresql' in os.getenv('DATABASE_URL', '') else {}
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = db.Column(db.String(36), db.ForeignKey(f'{SCHEMA}.users.id' if 'postgresql' in os.getenv('DATABASE_URL', '') else 'users.id'))
    provider_id = db.Column(db.String(36), db.ForeignKey(f'{SCHEMA}.users.id' if 'postgresql' in os.getenv('DATABASE_URL', '') else 'users.id'))

    # Booking details
    booking_date = db.Column(db.DateTime, nullable=False)
    duration_hours = db.Column(db.Float, nullable=False)  # Duration in hours
    hourly_rate = db.Column(db.Float, nullable=False)  # Rate at time of booking
    total_amount = db.Column(db.Float, nullable=False)  # Total cost

    # Payment details
    stripe_payment_intent_id = db.Column(db.String(100))
    stripe_charge_id = db.Column(db.String(100))
    payment_status = db.Column(db.String(20), default='pending')  # pending, paid, refunded, failed

    # Booking status
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, completed, cancelled
    location = db.Column(db.Text)  # Optional meeting location
    notes = db.Column(db.Text)  # Client notes
    cancellation_reason = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)
