# admin.py
# API routes for admin panel

from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app.models import User, Match, Chat, db
from sqlalchemy import func
import json

admin_bp = Blueprint('admin', __name__)

def admin_required():
    """Decorator to check if user is admin"""
    def wrapper(fn):
        @jwt_required()
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            if not user or not getattr(user, 'is_admin', False):
                return jsonify({'error': 'Admin access required'}), 403

            return fn(*args, **kwargs)
        decorator.__name__ = fn.__name__
        return decorator
    return wrapper

@admin_bp.route('/users', methods=['GET'])
@admin_required()
def get_all_users():
    """Get all users (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')

        query = User.query

        if search:
            query = query.filter(
                db.or_(
                    User.email.ilike(f'%{search}%'),
                    User.username.ilike(f'%{search}%'),
                    User.first_name.ilike(f'%{search}%')
                )
            )

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        users = []
        for user in pagination.items:
            users.append({
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'age': user.age,
                'gender': user.gender,
                'city': user.city,
                'goal': user.goal,
                'subscription_plan': user.subscription_plan,
                'trust_score': user.trust_score,
                'is_active': user.is_active,
                'is_banned': user.is_banned,
                'is_admin': getattr(user, 'is_admin', False),
                'created_at': user.created_at.isoformat() if user.created_at else None
            })

        return jsonify({
            'users': users,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500


@admin_bp.route('/impersonate/<user_id>', methods=['POST'])
@admin_required()
def impersonate_user(user_id):
    """Login as another user (admin only)"""
    try:
        target_user = User.query.get(user_id)

        if not target_user:
            return jsonify({'error': 'User not found'}), 404

        # Create access token for target user
        access_token = create_access_token(identity=target_user.id)

        return jsonify({
            'message': f'Now logged in as {target_user.username}',
            'access_token': access_token,
            'user': {
                'id': target_user.id,
                'email': target_user.email,
                'username': target_user.username,
                'first_name': target_user.first_name,
                'goal': target_user.goal,
                'subscription_plan': target_user.subscription_plan
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to impersonate user: {str(e)}'}), 500


@admin_bp.route('/stats', methods=['GET'])
@admin_required()
def get_stats():
    """Get platform statistics (admin only)"""
    try:
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        banned_users = User.query.filter_by(is_banned=True).count()

        # Users by goal
        users_by_goal = db.session.query(
            User.goal,
            func.count(User.id)
        ).group_by(User.goal).all()

        # Users by subscription
        users_by_subscription = db.session.query(
            User.subscription_plan,
            func.count(User.id)
        ).group_by(User.subscription_plan).all()

        # Total matches
        total_matches = Match.query.filter_by(status='matched').count()
        total_likes = Match.query.filter_by(status='liked').count()

        # Total messages
        total_messages = Chat.query.count()

        return jsonify({
            'total_users': total_users,
            'active_users': active_users,
            'banned_users': banned_users,
            'users_by_goal': dict(users_by_goal),
            'users_by_subscription': dict(users_by_subscription),
            'total_matches': total_matches,
            'total_likes': total_likes,
            'total_messages': total_messages
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500


@admin_bp.route('/user/<user_id>', methods=['PUT'])
@admin_required()
def update_user(user_id):
    """Update user (admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        # Update allowed fields
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'is_banned' in data:
            user.is_banned = data['is_banned']
        if 'banned_reason' in data:
            user.banned_reason = data['banned_reason']
        if 'trust_score' in data:
            user.trust_score = data['trust_score']
        if 'subscription_plan' in data:
            user.subscription_plan = data['subscription_plan']

        db.session.commit()

        return jsonify({'message': 'User updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500


@admin_bp.route('/matches', methods=['GET'])
@admin_required()
def get_all_matches():
    """Get all matches (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        pagination = Match.query.filter_by(status='matched').paginate(
            page=page, per_page=per_page, error_out=False
        )

        matches = []
        for match in pagination.items:
            user1 = User.query.get(match.sender_id)
            user2 = User.query.get(match.receiver_id)

            matches.append({
                'match_id': match.id,
                'created_at': match.created_at.isoformat(),
                'user1': {
                    'id': user1.id,
                    'username': user1.username,
                    'email': user1.email
                } if user1 else None,
                'user2': {
                    'id': user2.id,
                    'username': user2.username,
                    'email': user2.email
                } if user2 else None
            })

        return jsonify({
            'matches': matches,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch matches: {str(e)}'}), 500
