"""
Migration script to add Stripe Identity verification fields to users table
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env from project root
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

from sqlalchemy import create_engine, text

# Database URL
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://ittoken_db_user:Xm98VVSZv7cMJkopkdWRkgvZzC7Aly42@dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com/ittoken_db')

def migrate():
    """Add verification fields to users table"""
    
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in environment")
        return False
    
    # New columns for Stripe Identity verification
    new_columns = [
        ("identity_verified", "BOOLEAN DEFAULT FALSE"),
        ("identity_verification_status", "VARCHAR(30) DEFAULT 'unverified'"),
        ("stripe_identity_session_id", "VARCHAR(100)"),
        ("identity_verified_at", "TIMESTAMP"),
        ("identity_document_type", "VARCHAR(30)"),
        ("identity_age_verified", "BOOLEAN DEFAULT FALSE"),
        ("verification_attempts", "INTEGER DEFAULT 0"),
        ("last_verification_attempt", "TIMESTAMP"),
    ]
    
    engine = create_engine(DATABASE_URL)
    
    print("Connected to database successfully!")
    print("\nAdding verification columns to users table...")
    
    with engine.connect() as conn:
        for col_name, col_type in new_columns:
            try:
                # Check if column exists
                result = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'dating' 
                    AND table_name = 'users' 
                    AND column_name = '{col_name}'
                """))
                
                if result.fetchone() is None:
                    # Column doesn't exist, add it
                    conn.execute(text(f"""
                        ALTER TABLE dating.users 
                        ADD COLUMN {col_name} {col_type}
                    """))
                    conn.commit()
                    print(f"  ✓ Added column: {col_name}")
                else:
                    print(f"  ⏭️  Column already exists: {col_name}")
                    
            except Exception as e:
                print(f"  ✗ Error adding {col_name}: {e}")
                conn.rollback()
    
    print("\n✅ Migration completed successfully!")
    
    # Verify columns exist
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_schema = 'dating' 
            AND table_name = 'users' 
            AND column_name LIKE '%verif%' OR column_name LIKE '%identity%'
            ORDER BY ordinal_position
        """))
        
        print("\nVerification columns in users table:")
        for row in result.fetchall():
            print(f"  - {row[0]}: {row[1]} (default: {row[2]})")
    
    return True

if __name__ == "__main__":
    print("="*60)
    print("STRIPE IDENTITY VERIFICATION MIGRATION")
    print("="*60)
    migrate()
