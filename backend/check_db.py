#!/usr/bin/env python3
"""Check database connection and list tables."""
import os
import sys
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DATABASE_URL from environment
database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("❌ DATABASE_URL not set in environment")
    sys.exit(1)

print(f"📊 Connecting to database...")
print(f"   Database URL: {database_url[:50]}...")  # Don't print full URL (contains password)

try:
    # Create engine
    engine = create_engine(database_url)
    
    # Test connection
    with engine.connect() as conn:
        # Check if we can query
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"✅ Database connection successful!")
        print(f"   PostgreSQL version: {version[:50]}")
        
        # List all tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if tables:
            print(f"\n📋 Tables found in database ({len(tables)}):")
            for table in tables:
                # Get column info
                columns = inspector.get_columns(table)
                print(f"   - {table} ({len(columns)} columns)")
                for col in columns[:3]:  # Show first 3 columns
                    print(f"     • {col['name']} ({col['type']})")
                if len(columns) > 3:
                    print(f"     ... and {len(columns) - 3} more columns")
        else:
            print(f"\n⚠️  No tables found in database!")
            print(f"   You need to run migrations: alembic upgrade head")
            
        # Check for specific tables we need
        required_tables = ['hosts', 'parties', 'rsvps']
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print(f"\n❌ Missing required tables: {', '.join(missing_tables)}")
            print(f"   Run migrations to create them: alembic upgrade head")
        else:
            print(f"\n✅ All required tables exist!")
            
except Exception as e:
    print(f"❌ Database connection failed!")
    print(f"   Error: {e}")
    sys.exit(1)

