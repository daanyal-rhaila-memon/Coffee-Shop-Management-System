# init_db.py - Database initialization script
from app import create_app
from app.models import db, Category, Product, Admin
import bcrypt

def init_database():
    """Initialize database with sample data"""
    app = create_app()
    
    with app.app_context():
        print("🔄 Creating database tables...")
        db.create_all()
        
        # Check if data already exists
        if Category.query.first():
            print("⚠️  Database already initialized!")
            return
        
        print("📝 Inserting categories...")
        categories = [
            Category(category_name='Hot Drinks'),
            Category(category_name='Cold Drinks'),
            Category(category_name='Frappes'),
            Category(category_name='Shakes'),
            Category(category_name='Bakery'),
            Category(category_name='Snacks')
        ]
        db.session.add_all(categories)
        db.session.flush()
        
        print("☕ Inserting products...")
        products = [
            # Hot Drinks
            Product(
                name='Mocha Latte',
                category_id=1,
                description='Rich chocolate coffee blend',
                price=550,
                stock_quantity=100,
                image_url='images/mocha.jpg'
            ),
            Product(
                name='Espresso',
                category_id=1,
                description='Strong and bold coffee shot',
                price=700,
                stock_quantity=100,
                image_url='images/espresso.jpg'
            ),
            Product(
                name='Cappuccino',
                category_id=1,
                description='Espresso with steamed milk and foam',
                price=600,
                stock_quantity=100,
                image_url='images/cappuccino.jpg'
            ),
            
            # Cold Drinks
            Product(
                name='Caramel Iced Latte',
                category_id=2,
                description='Chilled espresso with caramel and milk',
                price=650,
                stock_quantity=100,
                image_url='images/caramelicedlatte.jpg'
            ),
            
            # Frappes
            Product(
                name='Vanilla Frappe',
                category_id=3,
                description='Blended coffee with vanilla and cream',
                price=700,
                stock_quantity=100,
                image_url='images/vanillafrappe.jpg'
            ),
            Product(
                name='Salted Caramel Frappe',
                category_id=3,
                description='Blended coffee with salted caramel and cream',
                price=750,
                stock_quantity=100,
                image_url='images/saltedcaramelfrappe.jpg'
            ),
            
            # Shakes
            Product(
                name='Chocolate Shake',
                category_id=4,
                description='Creamy shake with rich chocolate flavor',
                price=500,
                stock_quantity=100,
                image_url='images/chocolateshake.jpg'
            ),
            
            # Matcha
            Product(
                name='Matcha',
                category_id=2,
                description='Delicious and soulful Matcha',
                price=500,
                stock_quantity=100,
                image_url='images/matcha.jpg'
            ),
        ]
        db.session.add_all(products)
        
        print("👤 Creating admin account...")
        # Create default admin (username: admin, password: admin123)
        hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = Admin(
            username='admin',
            password=hashed_password,
            role='Manager'
        )
        db.session.add(admin)
        
        db.session.commit()
        
        print(" Database initialized successfully!")
        print(" Default Admin Credentials:")
        print("   Username: admin")
        print("   Password: admin123")
        print("\n  Please change the admin password after first login!")

# THIS IS THE IMPORTANT PART - ADD THIS AT THE BOTTOM:
if __name__ == '__main__':
    init_database()