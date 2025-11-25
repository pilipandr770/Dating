# match.py
# API routes for match

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.routes import match_bp
from app.models import User, Match, db
from sqlalchemy import and_, or_, not_
import json

@match_bp.route('/discover', methods=['GET'])
@jwt_required()
def discover():
    """Get potential matches for the current user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        if not current_user:
            return jsonify({'error': 'User not found'}), 404

        # Get category filter from query params (optional)
        category = request.args.get('category')

        # Get users that current user has already liked or passed
        existing_interactions = db.session.query(Match.receiver_id).filter(
            Match.sender_id == current_user_id
        ).all()
        excluded_ids = [interaction[0] for interaction in existing_interactions]
        excluded_ids.append(current_user_id)  # Exclude self

        # Build query for potential matches
        query = User.query.filter(
            not_(User.id.in_(excluded_ids)),
            User.is_active == True,
            User.is_banned == False
        )

        # Filter by category if provided, otherwise use user's own goal
        if category:
            query = query.filter(User.goal == category)
        else:
            query = query.filter(User.goal == current_user.goal)

        # Filter by gender preference
        if current_user.looking_for_gender and current_user.looking_for_gender != 'both':
            query = query.filter(User.gender == current_user.looking_for_gender)

        # Filter by age range
        if current_user.age_min:
            query = query.filter(User.age >= current_user.age_min)
        if current_user.age_max:
            query = query.filter(User.age <= current_user.age_max)

        # Get all potential matches
        potential_matches = query.limit(50).all()

        # Serialize users
        users = []
        for user in potential_matches:
            # Only include first photo for preview to reduce payload size
            photos_array = json.loads(user.photos) if user.photos else []
            first_photo = [photos_array[0]] if photos_array else []

            users.append({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'age': user.age,
                'gender': user.gender,
                'city': user.city,
                'bio': user.bio,
                'photos': first_photo,  # Only first photo for preview
                'goal': user.goal,
                'trust_score': user.trust_score,
                'is_service_provider': user.is_service_provider,
                'service_verified': user.service_verified,
                'hourly_rate': user.hourly_rate if user.is_service_provider else None
            })

        return jsonify({'users': users, 'count': len(users)}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch matches: {str(e)}'}), 500


@match_bp.route('/like', methods=['POST'])
@jwt_required()
def like_user():
    """Like a user (swipe right)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not data.get('user_id'):
            return jsonify({'error': 'user_id is required'}), 400

        receiver_id = data['user_id']

        # Check if user exists
        receiver = User.query.get(receiver_id)
        if not receiver:
            return jsonify({'error': 'User not found'}), 404

        # Check if already liked
        existing_match = Match.query.filter_by(
            sender_id=current_user_id,
            receiver_id=receiver_id
        ).first()

        if existing_match:
            return jsonify({'error': 'Already liked this user'}), 400

        # Create new match
        new_match = Match(
            sender_id=current_user_id,
            receiver_id=receiver_id,
            status='liked'
        )
        db.session.add(new_match)

        # Check if it's a mutual match
        reverse_match = Match.query.filter_by(
            sender_id=receiver_id,
            receiver_id=current_user_id,
            status='liked'
        ).first()

        is_mutual = False
        if reverse_match:
            # Update both matches to 'matched'
            new_match.status = 'matched'
            reverse_match.status = 'matched'
            is_mutual = True

        db.session.commit()

        return jsonify({
            'message': 'User liked successfully',
            'is_match': is_mutual,
            'match_id': new_match.id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to like user: {str(e)}'}), 500


@match_bp.route('/pass', methods=['POST'])
@jwt_required()
def pass_user():
    """Pass on a user (swipe left)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not data.get('user_id'):
            return jsonify({'error': 'user_id is required'}), 400

        receiver_id = data['user_id']

        # Check if already passed
        existing_match = Match.query.filter_by(
            sender_id=current_user_id,
            receiver_id=receiver_id
        ).first()

        if existing_match:
            return jsonify({'error': 'Already interacted with this user'}), 400

        # Create pass record
        new_match = Match(
            sender_id=current_user_id,
            receiver_id=receiver_id,
            status='passed'
        )
        db.session.add(new_match)
        db.session.commit()

        return jsonify({'message': 'User passed'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to pass user: {str(e)}'}), 500


@match_bp.route('/matches', methods=['GET'])
@jwt_required()
def get_matches():
    """Get all matched users (mutual likes)"""
    try:
        current_user_id = get_jwt_identity()

        # Get all mutual matches
        matches = Match.query.filter(
            or_(
                and_(Match.sender_id == current_user_id, Match.status == 'matched'),
                and_(Match.receiver_id == current_user_id, Match.status == 'matched')
            )
        ).all()

        # Get matched user details
        matched_users = []
        for match in matches:
            # Determine the other user
            other_user_id = match.receiver_id if match.sender_id == current_user_id else match.sender_id
            user = User.query.get(other_user_id)

            if user:
                # Only include first photo for preview
                photos_array = json.loads(user.photos) if user.photos else []
                first_photo = [photos_array[0]] if photos_array else []

                matched_users.append({
                    'match_id': match.id,
                    'matched_at': match.created_at.isoformat(),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'age': user.age,
                        'gender': user.gender,
                        'city': user.city,
                        'bio': user.bio,
                        'photos': first_photo,  # Only first photo
                        'trust_score': user.trust_score,
                        'last_active': user.last_active.isoformat() if user.last_active else None
                    }
                })

        return jsonify({'matches': matched_users, 'count': len(matched_users)}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch matches: {str(e)}'}), 500


@match_bp.route('/likes/incoming', methods=['GET'])
@jwt_required()
def get_incoming_likes():
    """Get users who liked you (incoming likes that are not matched yet)"""
    try:
        current_user_id = get_jwt_identity()

        # Get all incoming likes (where current user is receiver and status is 'liked')
        incoming_likes = Match.query.filter_by(
            receiver_id=current_user_id,
            status='liked'
        ).all()

        # Get user details for each incoming like
        likes = []
        for match in incoming_likes:
            user = User.query.get(match.sender_id)
            if user:
                # Only include first photo for preview
                photos_array = json.loads(user.photos) if user.photos else []
                first_photo = [photos_array[0]] if photos_array else []

                likes.append({
                    'match_id': match.id,
                    'liked_at': match.created_at.isoformat(),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'age': user.age,
                        'gender': user.gender,
                        'city': user.city,
                        'bio': user.bio,
                        'photos': first_photo,  # Only first photo
                        'goal': user.goal,
                        'trust_score': user.trust_score,
                        'is_service_provider': user.is_service_provider,
                        'service_verified': user.service_verified,
                        'hourly_rate': user.hourly_rate if user.is_service_provider else None
                    }
                })

        return jsonify({'likes': likes, 'count': len(likes)}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch incoming likes: {str(e)}'}), 500
