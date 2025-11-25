"""
Migration to increase tax_id field size from VARCHAR(100) to VARCHAR(255)
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def migrate():
    app, socketio = create_app()

    with app.app_context():
        try:
            # Get schema name
            schema = os.getenv('DATABASE_SCHEMA', 'public')

            print(f"Migrating tax_id field in {schema}.users table...")

            # Alter the column type
            query = text(f"""
                ALTER TABLE {schema}.users
                ALTER COLUMN tax_id TYPE VARCHAR(255);
            """)

            db.session.execute(query)
            db.session.commit()

            print("Migration successful!")
            print("tax_id field is now VARCHAR(255)")

        except Exception as e:
            print(f"Migration failed: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    migrate()
