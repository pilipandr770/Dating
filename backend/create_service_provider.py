"""
Script to create test service provider users
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.models import db, User

def create_service_providers():
    app, _ = create_app()

    with app.app_context():
        # Check if providers already exist
        existing = User.query.filter_by(username='provider1').first()
        if existing:
            print('Service providers already exist')
            return

        providers_data = [
            {
                'username': 'provider1',
                'email': 'provider1@test.com',
                'password': 'password123',
                'first_name': 'Анна',
                'last_name': 'Иванова',
                'age': 25,
                'gender': 'female',
                'city': 'Москва',
                'bio': 'Профессиональный эскорт-сервис. Индивидуальный подход к каждому клиенту.',
                'goal': 'intimate_services',
                'is_service_provider': True,
                'service_verified': False,
                'business_name': 'Elite Escort Moscow',
                'hourly_rate': 5000.0,
                'services_offered': ['Эскорт', 'Сопровождение на мероприятия', 'Встречи']
            },
            {
                'username': 'provider2',
                'email': 'provider2@test.com',
                'password': 'password123',
                'first_name': 'Мария',
                'last_name': 'Петрова',
                'age': 28,
                'gender': 'female',
                'city': 'Санкт-Петербург',
                'bio': 'VIP эскорт услуги. Доступна для деловых встреч и светских мероприятий.',
                'goal': 'intimate_services',
                'is_service_provider': True,
                'service_verified': False,
                'business_name': 'VIP Companion SPb',
                'hourly_rate': 7000.0,
                'services_offered': ['VIP Эскорт', 'Деловые встречи', 'Путешествия']
            },
            {
                'username': 'provider3',
                'email': 'provider3@test.com',
                'password': 'password123',
                'first_name': 'Екатерина',
                'last_name': 'Смирнова',
                'age': 23,
                'gender': 'female',
                'city': 'Москва',
                'bio': 'Молодая и энергичная. Готова скрасить ваш вечер.',
                'goal': 'intimate_services',
                'is_service_provider': True,
                'service_verified': False,
                'business_name': 'Dream Date',
                'hourly_rate': 4000.0,
                'services_offered': ['Встречи', 'Свидания', 'Сопровождение']
            }
        ]

        created_count = 0
        for provider_data in providers_data:
            provider = User(
                username=provider_data['username'],
                email=provider_data['email'],
                first_name=provider_data['first_name'],
                last_name=provider_data['last_name'],
                age=provider_data['age'],
                gender=provider_data['gender'],
                city=provider_data['city'],
                bio=provider_data['bio'],
                goal=provider_data['goal'],
                is_service_provider=provider_data['is_service_provider'],
                service_verified=provider_data['service_verified'],
                business_name=provider_data['business_name'],
                hourly_rate=provider_data['hourly_rate'],
                services_offered=provider_data['services_offered'],
                email_verified=True,
                photos='["https://i.pravatar.cc/300?img={}"]'.format(
                    10 if provider_data['username'] == 'provider1' else
                    20 if provider_data['username'] == 'provider2' else 30
                )
            )
            provider.set_password(provider_data['password'])

            db.session.add(provider)
            created_count += 1
            print(f"Created provider: {provider.username} ({provider.first_name}) - {provider.hourly_rate} RUB/h")

        db.session.commit()
        print(f'\nSuccessfully created {created_count} service providers')
        print('\nLogin credentials:')
        print('  Username: provider1, Password: password123')
        print('  Username: provider2, Password: password123')
        print('  Username: provider3, Password: password123')

if __name__ == '__main__':
    create_service_providers()
