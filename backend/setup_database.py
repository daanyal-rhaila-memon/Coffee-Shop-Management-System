# setup_database.py
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def create_database():
    """Create the mochamagic database"""
    try:
        # Connect to MySQL server (without specifying database)
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        print("Connected to MySQL server")
        
        with connection.cursor() as cursor:
            # Create database
            cursor.execute("CREATE DATABASE IF NOT EXISTS mochamagic")
            print(" Database 'mochamagic' created successfully!")
            
            # Show all databases to verify
            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            print("\n Available databases:")
            for db in databases:
                print(f"   - {db['Database']}")
        
        connection.close()
        print("\n Setup complete! Now run: python init_db.py")
        
    except pymysql.Error as e:
        print(f" Error: {e}")
        print("\n Make sure:")
        print("   1. MySQL Server is running")
        print("   2. Your DB_PASSWORD in .env is correct")
        print("   3. MySQL port 3306 is not blocked")

if __name__ == '__main__':
    create_database()