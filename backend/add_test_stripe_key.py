"""
Script to add test Stripe key to a service provider for testing payments
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def add_test_stripe_key():
    app, socketio = create_app()

    with app.app_context():
        # Get test Stripe key from environment
        test_stripe_key = os.getenv('STRIPE_API_KEY')

        if not test_stripe_key:
            print("ERROR: STRIPE_API_KEY not found in .env file")
            return

        # Find all service providers
        providers = User.query.filter_by(is_service_provider=True).all()

        if not providers:
            print("No service providers found in database")
            return

        print(f"Found {len(providers)} service provider(s)")
        print("\nAvailable providers:")
        for i, provider in enumerate(providers, 1):
            print(f"{i}. {provider.username} (ID: {provider.id}) - {provider.email}")
            if provider.tax_id:
                print(f"   Already has Stripe key: {'*' * 20}{provider.tax_id[-4:]}")

        # Ask which provider to update
        choice = input("\nEnter provider number to add test Stripe key (or 'all' for all): ").strip()

        if choice.lower() == 'all':
            selected_providers = providers
        else:
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(providers):
                    selected_providers = [providers[idx]]
                else:
                    print("Invalid choice")
                    return
            except ValueError:
                print("Invalid input")
                return

        # Add test Stripe key
        for provider in selected_providers:
            provider.tax_id = test_stripe_key
            provider.stripe_account_id = "acct_test_" + str(provider.id)
            provider.service_verified = True

            print(f"\nUpdated provider: {provider.username}")
            print(f"  Stripe Key: {'*' * 20}{test_stripe_key[-4:]}")
            print(f"  Account ID: {provider.stripe_account_id}")
            print(f"  Verified: {provider.service_verified}")

        db.session.commit()
        print("\nSuccessfully updated provider(s) with test Stripe key!")
        print("You can now test payments using this account.")

if __name__ == '__main__':
    add_test_stripe_key()
