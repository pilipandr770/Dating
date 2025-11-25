from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.routes import auth_bp
from app.models import db, User
from datetime import datetime
import re
import json

# Email validation
def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# Password validation (min 8 chars, 1 uppercase, 1 number)
def is_valid_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Valid"

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Required fields
        required_fields = ['email', 'password', 'username', 'goal', 'age', 'gender', 'city']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Validate email
        if not is_valid_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400

        # Check if email exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400

        # Check if username exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400

        # Validate password
        is_valid, message = is_valid_password(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400

        # Validate goal
        valid_goals = ['relationship', 'friendship', 'intimate_services', 'casual']
        if data['goal'] not in valid_goals:
            return jsonify({'error': f'Invalid goal. Must be one of: {", ".join(valid_goals)}'}), 400

        # Validate age
        if not isinstance(data['age'], int) or data['age'] < 18 or data['age'] > 100:
            return jsonify({'error': 'Age must be between 18 and 100'}), 400

        # Create new user
        new_user = User(
            email=data['email'].lower(),
            username=data['username'],
            goal=data['goal'],
            age=data['age'],
            gender=data['gender'],
            city=data['city'],
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            bio=data.get('bio'),
            looking_for_gender=data.get('looking_for_gender'),
            age_min=data.get('age_min', 18),
            age_max=data.get('age_max', 100)
        )

        new_user.set_password(data['password'])

        # If intimate_services, set as service provider
        if data['goal'] == 'intimate_services':
            new_user.is_service_provider = True
            if 'business_name' in data:
                new_user.business_name = data['business_name']
            if 'hourly_rate' in data:
                new_user.hourly_rate = data['hourly_rate']

        db.session.add(new_user)
        db.session.commit()

        # Create access token
        access_token = create_access_token(identity=new_user.id)

        return jsonify({
            'message': 'Registration successful',
            'access_token': access_token,
            'user': {
                'id': new_user.id,
                'email': new_user.email,
                'username': new_user.username,
                'goal': new_user.goal,
                'subscription_plan': new_user.subscription_plan,
                'is_service_provider': new_user.is_service_provider,
                'email_verified': new_user.email_verified
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400

        # Find user
        user = User.query.filter_by(email=data['email'].lower()).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Check if account is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403

        if user.is_banned:
            return jsonify({'error': f'Account is banned: {user.banned_reason}'}), 403

        # Update last active
        user.last_active = datetime.utcnow()
        db.session.commit()

        # Create access token
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'goal': user.goal,
                'subscription_plan': user.subscription_plan,
                'is_service_provider': user.is_service_provider,
                'service_verified': user.service_verified,
                'email_verified': user.email_verified,
                'trust_score': user.trust_score,
                'ai_assistant_enabled': user.ai_assistant_enabled
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # DON'T include photos here - they can be huge!
        # Photos are loaded separately in profile endpoints
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'age': user.age,
                'gender': user.gender,
                'city': user.city,
                'bio': user.bio,
                'goal': user.goal,
                'looking_for_gender': user.looking_for_gender,
                'age_min': user.age_min,
                'age_max': user.age_max,
                'subscription_plan': user.subscription_plan,
                'is_service_provider': user.is_service_provider,
                'service_verified': user.service_verified,
                'email_verified': user.email_verified,
                'phone_verified': user.phone_verified,
                'trust_score': user.trust_score,
                'ai_assistant_enabled': user.ai_assistant_enabled,
                # Identity Verification
                'identity_verified': user.identity_verified,
                'identity_verification_status': user.identity_verification_status,
                'identity_age_verified': user.identity_age_verified,
                # 'photos': removed to reduce payload size
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'is_admin': user.is_admin
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500
