# run.py
from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print("=" * 60)
    print(" MochaMagic Backend Server Starting...")
    print("=" * 60)
    print(f" Server: http://localhost:{port}")
    print(f" Debug Mode: {debug}")
    print(f" API Endpoints: http://localhost:{port}/api/")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )