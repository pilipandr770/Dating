# verification.py
# API routes for Stripe Identity verification (18+ age verification)

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.routes import verification_bp
from app.models import db, User
from datetime import datetime
import stripe
import os

# Platform Stripe key
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')

# Verification fee in EUR cents (e.g., 199 = €1.99)
VERIFICATION_FEE = int(os.getenv('VERIFICATION_FEE', '199'))  # Default €1.99

@verification_bp.route('/status', methods=['GET'])
@jwt_required()
def get_verification_status():
    """Get current user's verification status"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'identity_verified': user.identity_verified,
            'identity_verification_status': user.identity_verification_status or 'unverified',
            'identity_age_verified': user.identity_age_verified,
            'identity_verified_at': user.identity_verified_at.isoformat() if user.identity_verified_at else None,
            'identity_document_type': user.identity_document_type,
            'verification_attempts': user.verification_attempts or 0,
            'can_use_platform': user.identity_verified and user.identity_age_verified
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@verification_bp.route('/create-session', methods=['POST'])
@jwt_required()
def create_verification_session():
    """
    Create a Stripe Identity Verification Session
    This will charge the user for verification (GDPR compliant - Stripe stores data)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if already verified
        if user.identity_verified and user.identity_age_verified:
            return jsonify({'error': 'Already verified', 'verified': True}), 400
        
        # Check verification attempts limit (max 5 per day)
        if user.verification_attempts and user.verification_attempts >= 5:
            if user.last_verification_attempt:
                time_diff = datetime.utcnow() - user.last_verification_attempt
                if time_diff.total_seconds() < 86400:  # 24 hours
                    return jsonify({
                        'error': 'Too many verification attempts. Please try again tomorrow.',
                        'retry_after': 86400 - int(time_diff.total_seconds())
                    }), 429
                else:
                    # Reset counter after 24 hours
                    user.verification_attempts = 0
        
        # Initialize Stripe
        stripe.api_key = STRIPE_SECRET_KEY
        
        if not STRIPE_SECRET_KEY:
            return jsonify({'error': 'Payment system not configured'}), 500
        
        # Get frontend URL from request origin or use default
        frontend_url = request.headers.get('Origin', 'http://localhost:3000')
        
        # Create Stripe Identity Verification Session
        # Stripe Identity requires specific options
        verification_session = stripe.identity.VerificationSession.create(
            type='document',
            metadata={
                'user_id': current_user_id,
                'email': user.email,
                'username': user.username
            },
            options={
                'document': {
                    'allowed_types': ['driving_license', 'passport', 'id_card'],
                    'require_id_number': False,
                    'require_live_capture': True,
                    'require_matching_selfie': True,
                },
            },
            return_url=f'{frontend_url}/verification/complete?session_id={{CHECKOUT_SESSION_ID}}'
        )
        
        # Update user record
        user.stripe_identity_session_id = verification_session.id
        user.identity_verification_status = 'pending'
        user.verification_attempts = (user.verification_attempts or 0) + 1
        user.last_verification_attempt = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'session_id': verification_session.id,
            'client_secret': verification_session.client_secret,
            'url': verification_session.url,
            'status': 'pending',
            'verification_fee': VERIFICATION_FEE / 100,  # Return in EUR
            'currency': 'EUR'
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({'error': f'Stripe error: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@verification_bp.route('/check-session/<session_id>', methods=['GET'])
@jwt_required()
def check_verification_session(session_id):
    """Check the status of a verification session"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify session belongs to user
        if user.stripe_identity_session_id != session_id:
            return jsonify({'error': 'Session not found'}), 404
        
        stripe.api_key = STRIPE_SECRET_KEY
        
        # Retrieve verification session from Stripe
        verification_session = stripe.identity.VerificationSession.retrieve(session_id)
        
        status = verification_session.status
        
        # Update user based on status
        if status == 'verified':
            # Get verified data
            last_verification_report = verification_session.last_verification_report
            
            if last_verification_report:
                report = stripe.identity.VerificationReport.retrieve(last_verification_report)
                
                # Check if document verified and DOB confirms 18+
                dob = None
                if report.document and report.document.dob:
                    dob = report.document.dob
                    # Calculate age
                    today = datetime.utcnow().date()
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                    
                    if age >= 18:
                        user.identity_age_verified = True
                    else:
                        user.identity_age_verified = False
                        user.identity_verification_status = 'failed'
                        user.identity_verified = False
                        db.session.commit()
                        return jsonify({
                            'status': 'failed',
                            'reason': 'age_under_18',
                            'message': 'You must be 18 or older to use this platform.'
                        }), 200
                
                # Get document type
                if report.document and report.document.type:
                    user.identity_document_type = report.document.type
            
            user.identity_verified = True
            user.identity_verification_status = 'verified'
            user.identity_verified_at = datetime.utcnow()
            user.id_verified = True  # Also set legacy field
            user.trust_score = min(100, (user.trust_score or 50) + 30)  # Boost trust score
            
        elif status == 'requires_input':
            user.identity_verification_status = 'pending'
            
        elif status == 'processing':
            user.identity_verification_status = 'processing'
            
        elif status == 'canceled':
            user.identity_verification_status = 'cancelled'
            
        else:  # 'requires_action' or other
            user.identity_verification_status = status
        
        db.session.commit()
        
        return jsonify({
            'session_id': session_id,
            'status': status,
            'identity_verified': user.identity_verified,
            'identity_age_verified': user.identity_age_verified,
            'identity_verification_status': user.identity_verification_status,
            'can_use_platform': user.identity_verified and user.identity_age_verified
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({'error': f'Stripe error: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@verification_bp.route('/webhook', methods=['POST'])
def verification_webhook():
    """
    Stripe webhook for Identity verification events
    Configure in Stripe Dashboard: identity.verification_session.verified, etc.
    """
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.getenv('STRIPE_IDENTITY_WEBHOOK_SECRET')
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else:
            # For testing without webhook signature verification
            import json
            event = json.loads(payload)
        
        event_type = event.get('type') if isinstance(event, dict) else event.type
        data = event.get('data', {}).get('object', {}) if isinstance(event, dict) else event.data.object
        
        if event_type == 'identity.verification_session.verified':
            # Verification succeeded
            session_id = data.get('id') if isinstance(data, dict) else data.id
            user = User.query.filter_by(stripe_identity_session_id=session_id).first()
            
            if user:
                user.identity_verified = True
                user.identity_verification_status = 'verified'
                user.identity_verified_at = datetime.utcnow()
                user.id_verified = True
                user.trust_score = min(100, (user.trust_score or 50) + 30)
                
                # Try to get age verification from report
                last_report_id = data.get('last_verification_report') if isinstance(data, dict) else data.last_verification_report
                if last_report_id:
                    stripe.api_key = STRIPE_SECRET_KEY
                    report = stripe.identity.VerificationReport.retrieve(last_report_id)
                    if report.document and report.document.dob:
                        dob = report.document.dob
                        today = datetime.utcnow().date()
                        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                        user.identity_age_verified = age >= 18
                    
                    if report.document and report.document.type:
                        user.identity_document_type = report.document.type
                
                db.session.commit()
                
        elif event_type == 'identity.verification_session.requires_input':
            # User needs to provide more input
            session_id = data.get('id') if isinstance(data, dict) else data.id
            user = User.query.filter_by(stripe_identity_session_id=session_id).first()
            
            if user:
                user.identity_verification_status = 'requires_input'
                db.session.commit()
                
        elif event_type == 'identity.verification_session.canceled':
            # Verification was cancelled
            session_id = data.get('id') if isinstance(data, dict) else data.id
            user = User.query.filter_by(stripe_identity_session_id=session_id).first()
            
            if user:
                user.identity_verification_status = 'cancelled'
                db.session.commit()
        
        return jsonify({'received': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@verification_bp.route('/require-check', methods=['GET'])
@jwt_required()
def require_verification_check():
    """
    Check if user can access platform features
    Returns whether verification is required
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        can_access = user.identity_verified and user.identity_age_verified
        
        return jsonify({
            'can_access': can_access,
            'requires_verification': not can_access,
            'verification_status': user.identity_verification_status or 'unverified',
            'message': 'Access granted' if can_access else 'Identity verification required to use the platform'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
