"""
Script to create test users for all dating goals
Run this from the backend directory: python create_test_users.py
"""

import sys
import io
import random

# Set UTF-8 encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from app import create_app, db
from app.models import User
import json

# Test user data
CITIES = ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf']

MALE_NAMES = [
    ('Alexander', 'Schmidt'), ('Max', 'Müller'), ('Leon', 'Wagner'),
    ('Felix', 'Becker'), ('Lukas', 'Hoffmann'), ('Jonas', 'Fischer'),
    ('Noah', 'Weber'), ('Ben', 'Meyer'), ('Paul', 'Schulz'),
    ('Elias', 'Koch'), ('Tom', 'Bauer'), ('Daniel', 'Richter')
]

FEMALE_NAMES = [
    ('Emma', 'Klein'), ('Mia', 'Wolf'), ('Hannah', 'Schröder'),
    ('Sophia', 'Neumann'), ('Anna', 'Schwarz'), ('Lena', 'Zimmermann'),
    ('Leonie', 'Braun'), ('Marie', 'Krüger'), ('Sophie', 'Hofmann'),
    ('Charlotte', 'Hartmann'), ('Laura', 'Schmitt'), ('Lisa', 'Werner')
]

MALE_BIOS = [
    "Liebe Sport, Reisen und gutes Essen. Auf der Suche nach interessanten Gesprächen! 🎾",
    "Software-Entwickler aus Berlin. Mag Musik, Filme und lange Spaziergänge.",
    "Sportbegeistert und naturverbunden. Freue mich auf neue Bekanntschaften!",
    "Leidenschaftlicher Koch und Fotograf. Lass uns zusammen die Stadt erkunden! 📸",
    "Entspannter Typ, der gerne neue Leute kennenlernt. Kaffee? ☕",
    "Fitness-Fan und Technik-Enthusiast. Immer offen für Abenteuer! 💪"
]

FEMALE_BIOS = [
    "Kunstliebhaberin und Yoga-Fan. Suche nach echten Verbindungen! 🧘‍♀️",
    "Reiselustig und abenteuerlustig. Lass uns die Welt erkunden! ✈️",
    "Bücherwurm und Kaffeeliebhaberin. Immer bereit für gute Gespräche! 📚",
    "Kreativ, spontan und lebensfroh. Freue mich auf neue Begegnungen! 🎨",
    "Naturliebhaberin und Hobby-Fotografin. Auf der Suche nach Gleichgesinnten! 🌿",
    "Fashion & Design. Liebe gutes Essen und schöne Momente. 👗"
]

GOALS = ['relationship', 'friendship', 'intimate_services', 'casual']

def create_test_users():
    """Create test users for all dating goals"""
    app, socketio = create_app()

    with app.app_context():
        print("Creating test users...")
        created_count = 0

        for goal in GOALS:
            print(f"\n=== Creating users for goal: {goal} ===")

            # Create 3 male and 3 female users per goal
            for gender in ['male', 'female']:
                names_list = MALE_NAMES if gender == 'male' else FEMALE_NAMES
                bios_list = MALE_BIOS if gender == 'male' else FEMALE_BIOS

                for i in range(3):
                    first_name, last_name = random.choice(names_list)
                    age = random.randint(22, 45)
                    city = random.choice(CITIES)
                    bio = random.choice(bios_list)

                    # Create unique username and email
                    username = f"{first_name.lower()}{random.randint(100, 999)}"
                    email = f"{username}@test.com"

                    # Check if user already exists
                    if User.query.filter_by(email=email).first():
                        print(f"  [!] User {email} already exists, skipping...")
                        continue

                    # Create user
                    user = User(
                        email=email,
                        username=username,
                        first_name=first_name,
                        last_name=last_name,
                        age=age,
                        gender=gender,
                        city=city,
                        bio=bio,
                        goal=goal,
                        looking_for_gender='female' if gender == 'male' else 'male',
                        age_min=max(18, age - 10),
                        age_max=min(100, age + 10),
                        email_verified=True,
                        trust_score=random.randint(60, 95)
                    )

                    # Set password (all test users have password: Test123!)
                    user.set_password('Test123!')

                    # For intimate_services, set as service provider
                    if goal == 'intimate_services':
                        user.is_service_provider = True
                        user.service_verified = True
                        user.business_name = f"{first_name}'s Services"
                        user.hourly_rate = random.randint(100, 300)
                        user.services_offered = json.dumps(['escort', 'companionship'])

                    # Add some random photos (placeholder URLs)
                    # In production, these would be real uploaded photos
                    photo_count = random.randint(2, 4)
                    photos = []
                    for j in range(photo_count):
                        # Using placeholder image service
                        photos.append(f"https://i.pravatar.cc/400?img={random.randint(1, 70)}")
                    user.photos = json.dumps(photos)

                    db.session.add(user)
                    created_count += 1
                    print(f"  [+] Created: {username} ({first_name} {last_name}, {gender}, {age}) - {email}")

        # Commit all users
        db.session.commit()
        print(f"\n{'='*60}")
        print(f"[SUCCESS] Successfully created {created_count} test users!")
        print(f"{'='*60}")
        print("\nTest credentials:")
        print("  Password for all test users: Test123!")
        print("\nExample logins:")
        print("  relationship goal: Check database for emails like *@test.com")
        print("  friendship goal: Check database for emails like *@test.com")
        print("  intimate_services goal: Check database for emails like *@test.com")
        print("  casual goal: Check database for emails like *@test.com")

def list_test_users():
    """List all test users grouped by goal"""
    app, socketio = create_app()

    with app.app_context():
        print("\n" + "="*60)
        print("TEST USERS BY GOAL")
        print("="*60)

        for goal in GOALS:
            users = User.query.filter_by(goal=goal).all()
            print(f"\n{goal.upper()} ({len(users)} users):")
            print("-" * 60)
            for user in users:
                print(f"  {user.email:30} | {user.username:15} | {user.gender:6} | {user.age} | {user.city}")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'list':
        list_test_users()
    else:
        create_test_users()
        print("\nTo list all test users, run: python create_test_users.py list")
