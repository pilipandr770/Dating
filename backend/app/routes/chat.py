# chat.py
# API routes for chat

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.routes import chat_bp
from app.models import User, Match, Chat, db
from sqlalchemy import and_, or_
from datetime import datetime

@chat_bp.route('/<match_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(match_id):
    """Get all messages for a match/room"""
    try:
        current_user_id = get_jwt_identity()

        # Verify user is part of this match
        match = Match.query.filter(
            Match.id == match_id,
            or_(
                Match.sender_id == current_user_id,
                Match.receiver_id == current_user_id
            ),
            Match.status == 'matched'
        ).first()

        if not match:
            return jsonify({'error': 'Match not found or not authorized'}), 404

        # Get all messages for this match
        messages = Chat.query.filter_by(match_id=match_id).order_by(Chat.created_at).all()

        # Mark messages as read
        for msg in messages:
            if msg.sender_id != current_user_id and not msg.is_read:
                msg.is_read = True
        db.session.commit()

        # Serialize messages
        messages_data = []
        for msg in messages:
            sender = User.query.get(msg.sender_id)
            messages_data.append({
                'id': msg.id,
                'message': msg.message,
                'sender_id': msg.sender_id,
                'sender_name': sender.first_name or sender.username if sender else 'Unknown',
                'is_read': msg.is_read,
                'created_at': msg.created_at.isoformat()
            })

        # Get other user info
        other_user_id = match.receiver_id if match.sender_id == current_user_id else match.sender_id
        other_user = User.query.get(other_user_id)

        return jsonify({
            'messages': messages_data,
            'match_id': match_id,
            'other_user': {
                'id': other_user.id,
                'username': other_user.username,
                'first_name': other_user.first_name,
                'last_name': other_user.last_name,
                'photos': other_user.photos,
                'trust_score': other_user.trust_score
            } if other_user else None
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch messages: {str(e)}'}), 500


@chat_bp.route('/<match_id>/messages', methods=['POST'])
@jwt_required()
def send_message(match_id):
    """Send a message in a match/room"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not data.get('message'):
            return jsonify({'error': 'Message is required'}), 400

        # Verify user is part of this match
        match = Match.query.filter(
            Match.id == match_id,
            or_(
                Match.sender_id == current_user_id,
                Match.receiver_id == current_user_id
            ),
            Match.status == 'matched'
        ).first()

        if not match:
            return jsonify({'error': 'Match not found or not authorized'}), 404

        # Create new message
        new_message = Chat(
            match_id=match_id,
            sender_id=current_user_id,
            message=data['message'],
            is_read=False
        )
        db.session.add(new_message)
        db.session.commit()

        # Get sender info
        sender = User.query.get(current_user_id)

        return jsonify({
            'message': {
                'id': new_message.id,
                'message': new_message.message,
                'sender_id': new_message.sender_id,
                'sender_name': sender.first_name or sender.username if sender else 'Unknown',
                'is_read': new_message.is_read,
                'created_at': new_message.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to send message: {str(e)}'}), 500


@chat_bp.route('/<match_id>/room', methods=['GET'])
@jwt_required()
def get_room_info(match_id):
    """Get room information for a match (for features like movie theater, date planning)"""
    try:
        current_user_id = get_jwt_identity()

        # Verify user is part of this match
        match = Match.query.filter(
            Match.id == match_id,
            or_(
                Match.sender_id == current_user_id,
                Match.receiver_id == current_user_id
            ),
            Match.status == 'matched'
        ).first()

        if not match:
            return jsonify({'error': 'Match not found or not authorized'}), 404

        # Get both users
        user1 = User.query.get(match.sender_id)
        user2 = User.query.get(match.receiver_id)

        return jsonify({
            'match_id': match_id,
            'created_at': match.created_at.isoformat(),
            'users': [
                {
                    'id': user1.id,
                    'username': user1.username,
                    'first_name': user1.first_name,
                    'photos': user1.photos,
                    'subscription_plan': user1.subscription_plan
                },
                {
                    'id': user2.id,
                    'username': user2.username,
                    'first_name': user2.first_name,
                    'photos': user2.photos,
                    'subscription_plan': user2.subscription_plan
                }
            ],
            'features': {
                'chat': True,
                'movie_theater': True,  # Available for all users
                'date_planning': True,
                'ai_assistant': user1.ai_assistant_enabled or user2.ai_assistant_enabled,
                'video_chat': user1.subscription_plan == 'premium' or user2.subscription_plan == 'premium'
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch room info: {str(e)}'}), 500
