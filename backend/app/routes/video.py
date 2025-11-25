# video.py
# API routes for video calling with WebRTC signaling

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.routes import video_bp
from app.models import User, Match
from app import db
from datetime import datetime

# In-memory storage for WebRTC signaling (in production, use Redis or similar)
active_calls = {}  # {match_id: {user1_id: {offer/answer/candidates}, user2_id: {...}}}

@video_bp.route('/call/initiate', methods=['POST'])
@jwt_required()
def initiate_call():
    """Initiate a video call with another user"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        match_id = data.get('match_id')
        if not match_id:
            return jsonify({'error': 'Match ID is required'}), 400

        # Verify match exists
        match = Match.query.get(match_id)
        if not match:
            return jsonify({'error': 'Match not found'}), 404

        # Verify user is part of this match
        if current_user_id not in [match.user1_id, match.user2_id]:
            return jsonify({'error': 'Unauthorized'}), 403

        # Initialize call data structure
        if match_id not in active_calls:
            active_calls[match_id] = {
                'initiator': current_user_id,
                'users': {},
                'started_at': datetime.utcnow().isoformat()
            }

        return jsonify({
            'message': 'Call initiated',
            'match_id': match_id,
            'call_id': match_id
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to initiate call: {str(e)}'}), 500


@video_bp.route('/call/offer', methods=['POST'])
@jwt_required()
def send_offer():
    """Send WebRTC offer"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        match_id = data.get('match_id')
        offer = data.get('offer')

        if not match_id or not offer:
            return jsonify({'error': 'Match ID and offer are required'}), 400

        # Store offer
        if match_id not in active_calls:
            active_calls[match_id] = {'users': {}}

        active_calls[match_id]['users'][current_user_id] = {
            'offer': offer,
            'timestamp': datetime.utcnow().isoformat()
        }

        return jsonify({'message': 'Offer sent successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to send offer: {str(e)}'}), 500


@video_bp.route('/call/answer', methods=['POST'])
@jwt_required()
def send_answer():
    """Send WebRTC answer"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        match_id = data.get('match_id')
        answer = data.get('answer')

        if not match_id or not answer:
            return jsonify({'error': 'Match ID and answer are required'}), 400

        # Store answer
        if match_id not in active_calls:
            active_calls[match_id] = {'users': {}}

        if current_user_id not in active_calls[match_id]['users']:
            active_calls[match_id]['users'][current_user_id] = {}

        active_calls[match_id]['users'][current_user_id]['answer'] = answer
        active_calls[match_id]['users'][current_user_id]['timestamp'] = datetime.utcnow().isoformat()

        return jsonify({'message': 'Answer sent successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to send answer: {str(e)}'}), 500


@video_bp.route('/call/ice-candidate', methods=['POST'])
@jwt_required()
def send_ice_candidate():
    """Send ICE candidate"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        match_id = data.get('match_id')
        candidate = data.get('candidate')

        if not match_id or not candidate:
            return jsonify({'error': 'Match ID and candidate are required'}), 400

        # Store ICE candidate
        if match_id not in active_calls:
            active_calls[match_id] = {'users': {}}

        if current_user_id not in active_calls[match_id]['users']:
            active_calls[match_id]['users'][current_user_id] = {'ice_candidates': []}

        if 'ice_candidates' not in active_calls[match_id]['users'][current_user_id]:
            active_calls[match_id]['users'][current_user_id]['ice_candidates'] = []

        active_calls[match_id]['users'][current_user_id]['ice_candidates'].append(candidate)

        return jsonify({'message': 'ICE candidate sent successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to send ICE candidate: {str(e)}'}), 500


@video_bp.route('/call/poll', methods=['GET'])
@jwt_required()
def poll_call_data():
    """Poll for call data (offer, answer, ICE candidates) from other user"""
    try:
        current_user_id = get_jwt_identity()
        match_id = request.args.get('match_id')

        if not match_id:
            return jsonify({'error': 'Match ID is required'}), 400

        # Get match to find other user
        match = Match.query.get(match_id)
        if not match:
            return jsonify({'error': 'Match not found'}), 404

        # Find other user ID
        other_user_id = match.user2_id if match.user1_id == current_user_id else match.user1_id

        # Get call data
        call_data = active_calls.get(match_id, {})
        other_user_data = call_data.get('users', {}).get(other_user_id, {})

        response = {
            'offer': other_user_data.get('offer'),
            'answer': other_user_data.get('answer'),
            'ice_candidates': other_user_data.get('ice_candidates', [])
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': f'Failed to poll call data: {str(e)}'}), 500


@video_bp.route('/call/end', methods=['POST'])
@jwt_required()
def end_call():
    """End a video call"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        match_id = data.get('match_id')
        if not match_id:
            return jsonify({'error': 'Match ID is required'}), 400

        # Remove call data
        if match_id in active_calls:
            del active_calls[match_id]

        return jsonify({'message': 'Call ended successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to end call: {str(e)}'}), 500


@video_bp.route('/call/status', methods=['GET'])
@jwt_required()
def get_call_status():
    """Get status of active calls"""
    try:
        match_id = request.args.get('match_id')

        if not match_id:
            return jsonify({'error': 'Match ID is required'}), 400

        call_active = match_id in active_calls
        call_data = active_calls.get(match_id, {})

        return jsonify({
            'active': call_active,
            'initiator': call_data.get('initiator'),
            'started_at': call_data.get('started_at'),
            'participants': len(call_data.get('users', {}))
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get call status: {str(e)}'}), 500
