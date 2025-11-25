"""
Check if there are any bookings in the database
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Booking

def check_bookings():
    app, socketio = create_app()

    with app.app_context():
        # Get all bookings
        bookings = Booking.query.all()

        print(f"\n{'='*60}")
        print(f"Total bookings in database: {len(bookings)}")
        print(f"{'='*60}\n")

        if bookings:
            for booking in bookings:
                client = User.query.get(booking.client_id)
                provider = User.query.get(booking.provider_id)

                print(f"Booking ID: {booking.id}")
                print(f"  Client: {client.username if client else 'Unknown'} ({booking.client_id})")
                print(f"  Provider: {provider.username if provider else 'Unknown'} ({booking.provider_id})")
                print(f"  Date: {booking.booking_date}")
                print(f"  Duration: {booking.duration_hours} hours")
                print(f"  Amount: {booking.total_amount} RUB")
                print(f"  Status: {booking.status}")
                print(f"  Payment Status: {booking.payment_status}")
                print(f"  Payment Intent ID: {booking.stripe_payment_intent_id}")
                print(f"  Created: {booking.created_at}")
                print("-" * 60)
        else:
            print("No bookings found. You need to:")
            print("1. Login as a client")
            print("2. Find a service provider")
            print("3. Click 'Забронировать встречу'")
            print("4. Fill the form and create booking")

if __name__ == '__main__':
    check_bookings()
