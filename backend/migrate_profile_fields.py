"""
Migration script to add extended profile fields to users table
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

# Load .env from project root
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

# Database URL
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://ittoken_db_user:Xm98VVSZv7cMJkopkdWRkgvZzC7Aly42@dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com/ittoken_db')

def migrate():
    """Add new profile fields to users table"""
    engine = create_engine(DATABASE_URL)
    
    # New columns to add
    columns_to_add = [
        ("height", "INTEGER"),
        ("weight", "INTEGER"),
        ("body_type", "VARCHAR(50)"),
        ("hair_color", "VARCHAR(50)"),
        ("eye_color", "VARCHAR(50)"),
        ("zodiac_sign", "VARCHAR(50)"),
        ("education", "VARCHAR(100)"),
        ("occupation", "VARCHAR(100)"),
        ("company", "VARCHAR(100)"),
        ("languages", "JSON"),
        ("smoking", "VARCHAR(50)"),
        ("drinking", "VARCHAR(50)"),
        ("children", "VARCHAR(50)"),
        ("interests", "JSON"),
        ("relationship_type", "VARCHAR(50)"),
    ]
    
    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            try:
                # Check if column exists
                result = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'dating' 
                    AND table_name = 'users' 
                    AND column_name = '{column_name}'
                """))
                
                if result.fetchone() is None:
                    # Column doesn't exist, add it
                    conn.execute(text(f"""
                        ALTER TABLE dating.users 
                        ADD COLUMN {column_name} {column_type}
                    """))
                    conn.commit()
                    print(f"✅ Added column: {column_name} ({column_type})")
                else:
                    print(f"⏭️  Column already exists: {column_name}")
                    
            except Exception as e:
                print(f"❌ Error adding column {column_name}: {e}")
                conn.rollback()
    
    print("\n✅ Migration completed!")

if __name__ == "__main__":
    print("🚀 Starting migration for extended profile fields...")
    print(f"📡 Connecting to database...")
    migrate()
