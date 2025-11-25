# movie.py
# API routes for movie sessions

from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Match, MovieSession
from datetime import datetime

movie_bp = Blueprint('movie', __name__)

@movie_bp.route('/<match_id>/session', methods=['GET'])
@jwt_required()
def get_movie_session(match_id):
    """Get current movie session for a match"""
    try:
        current_user_id = get_jwt_identity()

        # Verify user is part of the match
        match = Match.query.filter(
            Match.id == match_id,
            ((Match.sender_id == current_user_id) | (Match.receiver_id == current_user_id)),
            Match.status == 'matched'
        ).first()

        if not match:
            return jsonify({'error': 'Match not found or unauthorized'}), 404

        # Get active session
        session = MovieSession.query.filter_by(match_id=match_id).order_by(MovieSession.created_at.desc()).first()

        if not session:
            return jsonify({'session': None}), 200

        return jsonify({
            'session': {
                'id': session.id,
                'movie_title': session.movie_title,
                'movie_url': session.movie_url,
                'movie_thumbnail': session.movie_thumbnail,
                'status': session.status,
                'current_time': session.current_time,
                'started_by': session.started_by,
                'started_at': session.started_at.isoformat() if session.started_at else None,
                'created_at': session.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get session: {str(e)}'}), 500


@movie_bp.route('/<match_id>/session', methods=['POST'])
@jwt_required()
def create_movie_session(match_id):
    """Create a new movie session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Verify user is part of the match
        match = Match.query.filter(
            Match.id == match_id,
            ((Match.sender_id == current_user_id) | (Match.receiver_id == current_user_id)),
            Match.status == 'matched'
        ).first()

        if not match:
            return jsonify({'error': 'Match not found or unauthorized'}), 404

        # Create new session
        session = MovieSession(
            match_id=match_id,
            movie_title=data.get('movie_title'),
            movie_url=data.get('movie_url'),
            movie_thumbnail=data.get('movie_thumbnail'),
            started_by=current_user_id,
            status='selecting'
        )

        db.session.add(session)
        db.session.commit()

        return jsonify({
            'message': 'Movie session created',
            'session': {
                'id': session.id,
                'movie_title': session.movie_title,
                'movie_url': session.movie_url,
                'status': session.status
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create session: {str(e)}'}), 500


@movie_bp.route('/<match_id>/session/<session_id>', methods=['PUT'])
@jwt_required()
def update_movie_session(match_id, session_id):
    """Update movie session (play, pause, seek, etc.)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Verify user is part of the match
        match = Match.query.filter(
            Match.id == match_id,
            ((Match.sender_id == current_user_id) | (Match.receiver_id == current_user_id)),
            Match.status == 'matched'
        ).first()

        if not match:
            return jsonify({'error': 'Match not found or unauthorized'}), 404

        # Get session
        session = MovieSession.query.filter_by(id=session_id, match_id=match_id).first()

        if not session:
            return jsonify({'error': 'Session not found'}), 404

        # Update fields
        if 'status' in data:
            session.status = data['status']
            if data['status'] == 'playing' and not session.started_at:
                session.started_at = datetime.utcnow()
            elif data['status'] == 'ended':
                session.ended_at = datetime.utcnow()

        if 'current_time' in data:
            session.current_time = data['current_time']

        if 'movie_title' in data:
            session.movie_title = data['movie_title']

        if 'movie_url' in data:
            session.movie_url = data['movie_url']

        if 'movie_thumbnail' in data:
            session.movie_thumbnail = data['movie_thumbnail']

        session.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Session updated',
            'session': {
                'id': session.id,
                'status': session.status,
                'current_time': session.current_time,
                'updated_at': session.updated_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update session: {str(e)}'}), 500


@movie_bp.route('/<match_id>/session/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_movie_session(match_id, session_id):
    """Delete/end a movie session"""
    try:
        current_user_id = get_jwt_identity()

        # Verify user is part of the match
        match = Match.query.filter(
            Match.id == match_id,
            ((Match.sender_id == current_user_id) | (Match.receiver_id == current_user_id)),
            Match.status == 'matched'
        ).first()

        if not match:
            return jsonify({'error': 'Match not found or unauthorized'}), 404

        # Get session
        session = MovieSession.query.filter_by(id=session_id, match_id=match_id).first()

        if not session:
            return jsonify({'error': 'Session not found'}), 404

        session.status = 'ended'
        session.ended_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Session ended'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to end session: {str(e)}'}), 500
