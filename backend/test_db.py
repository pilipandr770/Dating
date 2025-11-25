import os
from dotenv import load_dotenv
from app import create_app
from app.models import db

load_dotenv()

print("="*50)
print("Testing Database Connection")
print("="*50)

# Create app
app, socketio = create_app(os.getenv('FLASK_ENV', 'development'))

with app.app_context():
    # Show database URL (masked)
    db_url = app.config['SQLALCHEMY_DATABASE_URI']
    if 'postgresql' in db_url:
        print(f"\nDatabase Type: PostgreSQL")
        print(f"Schema: {app.config.get('DATABASE_SCHEMA', 'public')}")
    else:
        print(f"\nDatabase Type: SQLite")
        print(f"Database: {db_url}")

    # Test PostgreSQL-specific queries
    if 'postgresql' in db_url:
        try:
            result = db.session.execute(db.text("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'dating'"))
            schemas = result.fetchall()
            if schemas:
                print("\n[SUCCESS] Schema 'dating' exists!")
            else:
                print("\n[ERROR] Schema 'dating' not found!")

            # Check tables in schema
            result = db.session.execute(db.text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'dating'
                ORDER BY table_name
            """))
            tables = result.fetchall()

            if tables:
                print("\n[SUCCESS] Tables found in 'dating' schema:")
                for table in tables:
                    print(f"  - {table[0]}")
            else:
                print("\n[WARNING] No tables found in 'dating' schema")

        except Exception as e:
            print(f"\n[ERROR] Database error: {e}")
    else:
        print("\n[INFO] SQLite database - schema checking not applicable")

print("\n" + "="*50)
print("Test Complete")
print("="*50)
