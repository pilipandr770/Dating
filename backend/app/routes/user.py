# user.py
# API routes for user
# Optimized to reduce payload size by returning only first photo

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.routes import user_bp
from app.models import User, Match
from app import db
import json

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile including photos"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        # Update basic profile fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'age' in data:
            user.age = int(data['age'])
        if 'gender' in data:
            user.gender = data['gender']
        if 'city' in data:
            user.city = data['city']
        if 'bio' in data:
            user.bio = data['bio']

        # Update preferences
        if 'looking_for_gender' in data:
            user.looking_for_gender = data['looking_for_gender']
        if 'age_min' in data:
            user.age_min = int(data['age_min'])
        if 'age_max' in data:
            user.age_max = int(data['age_max'])

        # Update photos (stored as JSON array)
        if 'photos' in data:
            # Convert photos list to JSON string for PostgreSQL
            user.photos = json.dumps(data['photos']) if isinstance(data['photos'], list) else data['photos']

        # Update timestamp
        from datetime import datetime
        user.updated_at = datetime.utcnow()

        db.session.commit()

        # Return updated user data
        user_data = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'age': user.age,
            'gender': user.gender,
            'city': user.city,
            'bio': user.bio,
            'looking_for_gender': user.looking_for_gender,
            'age_min': user.age_min,
            'age_max': user.age_max,
            'photos': json.loads(user.photos) if user.photos else [],
            'subscription_plan': user.subscription_plan,
            'trust_score': user.trust_score,
        }

        return jsonify({'message': 'Profile updated successfully', 'user': user_data}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500


@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """Get user profile by ID with match information"""
    try:
        current_user_id = get_jwt_identity()
        print(f"[GET USER PROFILE] Current user: {current_user_id}, Requested user: {user_id}")

        user = User.query.get(user_id)

        if not user:
            print(f"[GET USER PROFILE] User {user_id} not found")
            return jsonify({'error': 'User not found'}), 404

        print(f"[GET USER PROFILE] User found: {user.username}")

        # Check if there's a match between current user and this user
        match = Match.query.filter(
            (((Match.sender_id == current_user_id) & (Match.receiver_id == user_id)) |
             ((Match.sender_id == user_id) & (Match.receiver_id == current_user_id))) &
            (Match.status == 'matched')
        ).first()

        # Prepare user data with defaults for None values
        # Only include first photo to reduce payload size
        photos_array = json.loads(user.photos) if user.photos else []
        first_photo = [photos_array[0]] if photos_array else []

        user_data = {
            'id': user.id,
            'username': user.username or 'Пользователь',
            'first_name': user.first_name,
            'last_name': user.last_name,
            'age': user.age or 18,
            'gender': user.gender,
            'city': user.city or 'Не указано',
            'bio': user.bio or '',
            'photos': photos_array,  # Return all photos for full profile view
            'subscription_plan': user.subscription_plan or 'free',
            'trust_score': user.trust_score if user.trust_score is not None else 50,
            'is_service_provider': user.is_service_provider or False,
            'hourly_rate': user.hourly_rate,
            'service_verified': user.service_verified or False,
            'services_offered': user.services_offered or [],
            
            # Extended profile
            'height': user.height,
            'weight': user.weight,
            'body_type': user.body_type,
            'hair_color': user.hair_color,
            'eye_color': user.eye_color,
            'zodiac_sign': user.zodiac_sign,
            'education': user.education,
            'occupation': user.occupation,
            'company': user.company,
            'languages': user.languages or [],
            'smoking': user.smoking,
            'drinking': user.drinking,
            'children': user.children,
            'interests': user.interests or [],
            'relationship_type': user.relationship_type,
            'goal': user.goal,
            
            # Activity
            'last_active': user.last_active.isoformat() if user.last_active else None,
            'created_at': user.created_at.isoformat() if user.created_at else None,
        }

        response_data = {
            'user': user_data,
            'match_id': match.id if match else None,
            'is_matched': match is not None
        }

        print(f"[GET USER PROFILE] Returning data for user {user.username}, match: {match.id if match else 'None'}")
        return jsonify(response_data), 200

    except Exception as e:
        print(f"[GET USER PROFILE ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500
