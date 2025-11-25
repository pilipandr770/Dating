"""
Create a test booking between a client and a service provider
"""
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Booking

def create_test_booking():
    app, socketio = create_app()

    with app.app_context():
        # Find a client (non-provider user)
        client = User.query.filter_by(is_service_provider=False).first()

        # Find a provider
        provider = User.query.filter_by(is_service_provider=True, service_verified=True).first()

        if not client:
            print("ERROR: No client users found in database")
            print("Please create a regular user first")
            return

        if not provider:
            print("ERROR: No verified service providers found in database")
            return

        if not provider.hourly_rate:
            print(f"ERROR: Provider {provider.username} has no hourly rate set")
            return

        # Create booking for tomorrow
        booking_date = datetime.now() + timedelta(days=1)
        booking_date = booking_date.replace(hour=18, minute=0, second=0, microsecond=0)

        duration_hours = 2.0
        total_amount = duration_hours * provider.hourly_rate

        # Create booking
        booking = Booking(
            client_id=client.id,
            provider_id=provider.id,
            booking_date=booking_date,
            duration_hours=duration_hours,
            hourly_rate=provider.hourly_rate,
            total_amount=total_amount,
            location="Test Location - Central Hotel",
            notes="This is a test booking created automatically",
            status='pending',
            payment_status='pending'
        )

        db.session.add(booking)
        db.session.commit()

        print("\n" + "="*60)
        print("TEST BOOKING CREATED SUCCESSFULLY!")
        print("="*60)
        print(f"Booking ID: {booking.id}")
        print(f"Client: {client.username} ({client.email})")
        print(f"Provider: {provider.username} ({provider.email})")
        print(f"Date: {booking_date.strftime('%Y-%m-%d %H:%M')}")
        print(f"Duration: {duration_hours} hours")
        print(f"Hourly Rate: {provider.hourly_rate} RUB")
        print(f"Total Amount: {total_amount} RUB")
        print(f"Status: {booking.status}")
        print(f"Payment Status: {booking.payment_status}")
        print("="*60)
        print("\nNOW YOU CAN:")
        print(f"1. Login as CLIENT: {client.email}")
        print("2. Go to 'Moi bronirovaniya' page")
        print("3. Click 'Oplatit' button")
        print("4. Fill the payment form with test card: 4242 4242 4242 4242")
        print("="*60 + "\n")

if __name__ == '__main__':
    create_test_booking()
