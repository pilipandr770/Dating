# payment.py
# API routes for payment and bookings

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.routes import payment_bp
from app.models import db, User, Booking
from datetime import datetime
from sqlalchemy import or_, and_

# Import stripe for real implementation
import stripe
import os

# Platform Stripe key (for collecting platform fees)
PLATFORM_STRIPE_KEY = os.getenv('STRIPE_SECRET_KEY')

@payment_bp.route('/provider/setup', methods=['POST'])
@jwt_required()
def setup_stripe_account():
    """Setup Stripe account for service provider"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user or not user.is_service_provider:
            return jsonify({'error': 'Only service providers can setup payment accounts'}), 403

        data = request.get_json()
        provider_stripe_key = data.get('tax_id')  # Frontend sends Stripe key as tax_id

        if not provider_stripe_key:
            return jsonify({'error': 'Stripe Secret Key is required'}), 400

        # Validate Stripe key by trying to retrieve account info
        try:
            # Use provider's Stripe key to get their account info
            account = stripe.Account.retrieve(api_key=provider_stripe_key)

            # Verify this is a valid Stripe account
            if not account or not account.id:
                return jsonify({'error': 'Invalid Stripe key'}), 400

            # Check if account is verified
            account_verified = account.charges_enabled and account.payouts_enabled

            # Save provider's Stripe key (encrypted in production!)
            user.tax_id = provider_stripe_key
            user.stripe_account_id = account.id
            user.service_verified = account_verified

            # Optionally extract business name
            if account.business_profile and account.business_profile.name:
                user.business_name = account.business_profile.name

            db.session.commit()

            return jsonify({
                'message': 'Stripe account connected successfully',
                'account_id': account.id,
                'verified': account_verified,
                'charges_enabled': account.charges_enabled,
                'payouts_enabled': account.payouts_enabled
            }), 200

        except stripe.error.AuthenticationError:
            return jsonify({'error': 'Invalid Stripe API key. Please check your key and try again.'}), 400
        except stripe.error.StripeError as e:
            return jsonify({'error': f'Stripe error: {str(e)}'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to setup account: {str(e)}'}), 500


@payment_bp.route('/provider/stats', methods=['GET'])
@jwt_required()
def get_provider_stats():
    """Get statistics for service provider"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user or not user.is_service_provider:
            return jsonify({'error': 'Only service providers can view stats'}), 403

        # Get all bookings for this provider
        bookings = Booking.query.filter_by(provider_id=current_user_id).all()

        # Calculate statistics
        total_bookings = len(bookings)
        completed_bookings = len([b for b in bookings if b.status == 'completed'])
        total_earnings = sum([b.total_amount for b in bookings if b.payment_status == 'paid'])
        pending_earnings = sum([b.total_amount for b in bookings if b.payment_status == 'pending'])

        # Recent bookings
        recent_bookings = sorted(bookings, key=lambda x: x.created_at, reverse=True)[:10]
        recent_bookings_data = []
        for booking in recent_bookings:
            client = User.query.get(booking.client_id)
            recent_bookings_data.append({
                'id': booking.id,
                'client_name': client.username if client else 'Unknown',
                'booking_date': booking.booking_date.isoformat(),
                'duration_hours': booking.duration_hours,
                'total_amount': booking.total_amount,
                'status': booking.status,
                'payment_status': booking.payment_status,
                'created_at': booking.created_at.isoformat()
            })

        return jsonify({
            'total_bookings': total_bookings,
            'completed_bookings': completed_bookings,
            'total_earnings': total_earnings,
            'pending_earnings': pending_earnings,
            'hourly_rate': user.hourly_rate,
            'recent_bookings': recent_bookings_data,
            'stripe_connected': user.stripe_account_id is not None,
            'verified': user.service_verified
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500


@payment_bp.route('/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    """Create a new booking"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        print(f"\n{'='*60}")
        print(f"[CREATE BOOKING] Request from user: {current_user_id}")
        print(f"[CREATE BOOKING] Request data: {data}")

        # Validate required fields
        required_fields = ['provider_id', 'booking_date', 'duration_hours']
        for field in required_fields:
            if field not in data:
                print(f"[CREATE BOOKING] Missing field: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Get provider
        provider = User.query.get(data['provider_id'])
        if not provider or not provider.is_service_provider:
            print(f"[CREATE BOOKING] Provider not found or not a service provider")
            return jsonify({'error': 'Provider not found'}), 404

        if not provider.hourly_rate:
            print(f"[CREATE BOOKING] Provider has no hourly rate")
            return jsonify({'error': 'Provider has not set hourly rate'}), 400

        # Calculate total amount
        duration = float(data['duration_hours'])
        total_amount = duration * provider.hourly_rate

        print(f"[CREATE BOOKING] Creating booking: duration={duration}h, rate={provider.hourly_rate}, total={total_amount}")

        # Create booking
        booking = Booking(
            client_id=current_user_id,
            provider_id=data['provider_id'],
            booking_date=datetime.fromisoformat(data['booking_date'].replace('Z', '+00:00')),
            duration_hours=duration,
            hourly_rate=provider.hourly_rate,
            total_amount=total_amount,
            location=data.get('location'),
            notes=data.get('notes'),
            status='pending',
            payment_status='pending'
        )

        db.session.add(booking)
        db.session.commit()

        print(f"[CREATE BOOKING] Booking created successfully with ID: {booking.id}")
        print(f"{'='*60}\n")

        return jsonify({
            'message': 'Booking created successfully',
            'booking': {
                'id': booking.id,
                'booking_date': booking.booking_date.isoformat(),
                'duration_hours': booking.duration_hours,
                'total_amount': booking.total_amount,
                'status': booking.status,
                'payment_status': booking.payment_status
            }
        }), 201

    except Exception as e:
        print(f"[CREATE BOOKING ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        db.session.rollback()
        return jsonify({'error': f'Failed to create booking: {str(e)}'}), 500


@payment_bp.route('/bookings/<booking_id>/pay', methods=['POST'])
@jwt_required()
def pay_for_booking(booking_id):
    """Create Stripe payment intent for booking"""
    try:
        current_user_id = get_jwt_identity()
        booking = Booking.query.get(booking_id)

        print(f"\n{'='*60}")
        print(f"[PAY BOOKING] Request for booking: {booking_id}")
        print(f"[PAY BOOKING] User ID: {current_user_id}")

        if not booking:
            print(f"[PAY BOOKING] ❌ Booking not found")
            return jsonify({'error': 'Booking not found'}), 404

        if booking.client_id != current_user_id:
            print(f"[PAY BOOKING] ❌ Unauthorized")
            return jsonify({'error': 'Unauthorized'}), 403

        if booking.payment_status == 'paid':
            print(f"[PAY BOOKING] ❌ Already paid")
            return jsonify({'error': 'Booking already paid'}), 400

        # Get provider
        provider = User.query.get(booking.provider_id)
        print(f"[PAY BOOKING] Provider: {provider.username if provider else 'None'}")
        print(f"[PAY BOOKING] Provider has Stripe key: {bool(provider.tax_id)}")

        # Если у провайдера нет Stripe ключа - используем тестовый режим
        if not provider.tax_id:
            print(f"[PAY BOOKING] ⚠️ Provider has no Stripe key - using TEST MODE")
            # В тестовом режиме возвращаем фейковый client_secret
            return jsonify({
                'message': 'Test mode - Payment intent simulated',
                'client_secret': f'test_secret_{booking.id}',
                'payment_intent_id': f'test_pi_{booking.id}',
                'amount': booking.total_amount,
                'currency': 'rub',
                'test_mode': True
            }), 200

        # Calculate amounts
        amount_rub = int(booking.total_amount * 100)  # Amount in kopecks
        platform_fee = int(amount_rub * 0.10)  # 10% platform fee

        # Create Payment Intent using provider's Stripe account
        # This creates a direct charge on provider's account
        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_rub,
                currency='rub',
                api_key=provider.tax_id,  # Use provider's Stripe key
                metadata={
                    'booking_id': booking.id,
                    'client_id': current_user_id,
                    'provider_id': provider.id,
                    'platform': 'LoveMatch'
                },
                description=f"Booking #{booking.id} - {provider.username}"
            )

            # Save payment intent ID
            booking.stripe_payment_intent_id = payment_intent.id
            db.session.commit()

            print(f"[PAY BOOKING] ✅ Payment Intent created: {payment_intent.id}")
            print(f"{'='*60}\n")

            return jsonify({
                'message': 'Payment intent created',
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id,
                'amount': booking.total_amount,
                'currency': 'rub'
            }), 200

        except stripe.error.StripeError as e:
            print(f"[PAY BOOKING] ❌ Stripe error: {str(e)}")
            return jsonify({'error': f'Stripe error: {str(e)}'}), 400

    except Exception as e:
        print(f"[PAY BOOKING ERROR] {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Payment failed: {str(e)}'}), 500


@payment_bp.route('/bookings/<booking_id>/confirm-payment', methods=['POST'])
@jwt_required()
def confirm_payment(booking_id):
    """Confirm that payment was successful (called after Stripe webhook or client confirmation)"""
    try:
        current_user_id = get_jwt_identity()
        booking = Booking.query.get(booking_id)

        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        if booking.client_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Get provider
        provider = User.query.get(booking.provider_id)

        # Verify payment intent status
        if booking.stripe_payment_intent_id:
            try:
                payment_intent = stripe.PaymentIntent.retrieve(
                    booking.stripe_payment_intent_id,
                    api_key=provider.tax_id
                )

                if payment_intent.status == 'succeeded':
                    booking.payment_status = 'paid'
                    booking.stripe_charge_id = payment_intent.latest_charge if hasattr(payment_intent, 'latest_charge') else None
                    db.session.commit()

                    return jsonify({
                        'message': 'Payment confirmed',
                        'booking': {
                            'id': booking.id,
                            'payment_status': booking.payment_status,
                            'total_amount': booking.total_amount
                        }
                    }), 200
                else:
                    return jsonify({
                        'error': 'Payment not completed',
                        'status': payment_intent.status
                    }), 400

            except stripe.error.StripeError as e:
                return jsonify({'error': f'Stripe error: {str(e)}'}), 400
        else:
            return jsonify({'error': 'No payment intent found'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to confirm payment: {str(e)}'}), 500


@payment_bp.route('/bookings/<booking_id>/confirm-payment-test', methods=['POST'])
@jwt_required()
def confirm_payment_test(booking_id):
    """Тестовое подтверждение оплаты (для разработки)"""
    try:
        current_user_id = get_jwt_identity()
        booking = Booking.query.get(booking_id)

        print(f"\n{'='*60}")
        print(f"[CONFIRM PAYMENT TEST] Booking ID: {booking_id}")
        print(f"[CONFIRM PAYMENT TEST] User ID: {current_user_id}")

        if not booking:
            print(f"[CONFIRM PAYMENT TEST] Booking not found!")
            return jsonify({'error': 'Booking not found'}), 404

        if booking.client_id != current_user_id:
            print(f"[CONFIRM PAYMENT TEST] Unauthorized - client_id={booking.client_id}, current_user={current_user_id}")
            return jsonify({'error': 'Unauthorized'}), 403

        # В тестовом режиме просто помечаем как оплачено
        booking.payment_status = 'paid'
        db.session.commit()

        print(f"[CONFIRM PAYMENT TEST] ✅ Payment marked as paid!")
        print(f"{'='*60}\n")

        return jsonify({
            'message': 'Payment confirmed (test mode)',
            'booking': {
                'id': booking.id,
                'payment_status': booking.payment_status,
                'total_amount': booking.total_amount,
                'status': booking.status,
                'booking_date': booking.booking_date.isoformat()
            }
        }), 200

    except Exception as e:
        print(f"[CONFIRM PAYMENT TEST ERROR] {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Failed to confirm payment: {str(e)}'}), 500


@payment_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_my_bookings():
    """Get user's bookings (as client or provider)"""
    try:
        current_user_id = get_jwt_identity()
        role = request.args.get('role', 'client')  # 'client' or 'provider'

        print(f"\n{'='*60}")
        print(f"[GET BOOKINGS] User ID: {current_user_id}")
        print(f"[GET BOOKINGS] Role: {role}")

        if role == 'client':
            bookings = Booking.query.filter_by(client_id=current_user_id).order_by(Booking.created_at.desc()).all()
            print(f"[GET BOOKINGS] Found {len(bookings)} bookings as CLIENT")
        else:
            bookings = Booking.query.filter_by(provider_id=current_user_id).order_by(Booking.created_at.desc()).all()
            print(f"[GET BOOKINGS] Found {len(bookings)} bookings as PROVIDER")

        bookings_data = []
        for booking in bookings:
            print(f"[GET BOOKINGS] Processing booking {booking.id}: status={booking.status}, payment={booking.payment_status}, amount={booking.total_amount}")

            if role == 'client':
                other_user = User.query.get(booking.provider_id)
            else:
                other_user = User.query.get(booking.client_id)

            bookings_data.append({
                'id': booking.id,
                'other_user': {
                    'id': other_user.id,
                    'username': other_user.username,
                    'first_name': other_user.first_name
                } if other_user else None,
                'booking_date': booking.booking_date.isoformat(),
                'duration_hours': booking.duration_hours,
                'hourly_rate': booking.hourly_rate,
                'total_amount': booking.total_amount,
                'status': booking.status,
                'payment_status': booking.payment_status,
                'location': booking.location,
                'notes': booking.notes,
                'created_at': booking.created_at.isoformat()
            })

        print(f"[GET BOOKINGS] Returning {len(bookings_data)} bookings")
        print(f"{'='*60}\n")
        return jsonify({'bookings': bookings_data, 'count': len(bookings_data)}), 200

    except Exception as e:
        print(f"[GET BOOKINGS ERROR] {str(e)}")
        return jsonify({'error': f'Failed to get bookings: {str(e)}'}), 500


@payment_bp.route('/bookings/<booking_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_booking(booking_id):
    """Provider confirms a booking"""
    try:
        current_user_id = get_jwt_identity()
        booking = Booking.query.get(booking_id)

        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        if booking.provider_id != current_user_id:
            return jsonify({'error': 'Only provider can confirm booking'}), 403

        if booking.payment_status != 'paid':
            return jsonify({'error': 'Booking must be paid before confirmation'}), 400

        booking.status = 'confirmed'
        booking.confirmed_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Booking confirmed',
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'confirmed_at': booking.confirmed_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to confirm booking: {str(e)}'}), 500


@payment_bp.route('/bookings/<booking_id>/complete', methods=['POST'])
@jwt_required()
def complete_booking(booking_id):
    """Mark booking as completed"""
    try:
        current_user_id = get_jwt_identity()
        booking = Booking.query.get(booking_id)

        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        if booking.provider_id != current_user_id:
            return jsonify({'error': 'Only provider can complete booking'}), 403

        booking.status = 'completed'
        booking.completed_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Booking completed',
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'completed_at': booking.completed_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to complete booking: {str(e)}'}), 500
