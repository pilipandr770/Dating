"""
Script to set hourly rate for a service provider
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get('DATABASE_URL')

def set_hourly_rate(username, hourly_rate):
    """Set hourly rate for a provider"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if user exists and is provider
        result = conn.execute(text("""
            SELECT id, username, is_service_provider, hourly_rate 
            FROM dating.users 
            WHERE username = :username
        """), {'username': username})
        
        user = result.fetchone()
        
        if not user:
            print(f"❌ User '{username}' not found")
            return
        
        print(f"📋 User: {user[1]}")
        print(f"   is_service_provider: {user[2]}")
        print(f"   current hourly_rate: {user[3]}")
        
        # Update hourly rate
        conn.execute(text("""
            UPDATE dating.users 
            SET hourly_rate = :rate, is_service_provider = true
            WHERE username = :username
        """), {'rate': hourly_rate, 'username': username})
        conn.commit()
        
        print(f"✅ Updated hourly_rate to {hourly_rate} €/Std for {username}")

if __name__ == "__main__":
    # Set hourly rate for lisa203
    print("🚀 Setting hourly rate for provider...")
    set_hourly_rate('lisa203', 5000)  # 5000 €/Std
