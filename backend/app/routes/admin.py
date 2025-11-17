# app/routes/admin.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token
from app.models import db, Admin, Product, Category, Orders, Customer, Review
from sqlalchemy import func
import bcrypt

admin_bp = Blueprint('admin', __name__)

# Admin authentication decorator (to be used after jwt_required)
def admin_required(fn):
    """Decorator to check if user is admin (add after @jwt_required)"""
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # This is a placeholder - implement proper admin check
        # For now, we'll assume admin endpoints require admin JWT
        return fn(*args, **kwargs)
    return wrapper


@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        admin = Admin.query.filter_by(username=data['username']).first()
        
        if not admin:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not bcrypt.checkpw(
            data['password'].encode('utf-8'),
            admin.password.encode('utf-8')
        ):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=f'admin_{admin.admin_id}')
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'admin': admin.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== PRODUCT MANAGEMENT =====
@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def add_product():
    """Add a new product"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        new_product = Product(
            name=data['name'],
            category_id=data.get('category_id'),
            description=data.get('description', ''),
            price=data['price'],
            stock_quantity=data.get('stock_quantity', 0),
            image_url=data.get('image_url', '')
        )
        
        db.session.add(new_product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product added successfully',
            'product': new_product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update product details"""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            product.name = data['name']
        if 'category_id' in data:
            product.category_id = data['category_id']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = data['price']
        if 'stock_quantity' in data:
            product.stock_quantity = data['stock_quantity']
        if 'image_url' in data:
            product.image_url = data['image_url']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete a product"""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===== CATEGORY MANAGEMENT =====
@admin_bp.route('/categories', methods=['POST'])
@jwt_required()
def add_category():
    """Add a new category"""
    try:
        data = request.get_json()
        
        if not data.get('category_name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if category already exists
        existing = Category.query.filter_by(category_name=data['category_name']).first()
        if existing:
            return jsonify({'error': 'Category already exists'}), 400
        
        new_category = Category(category_name=data['category_name'])
        
        db.session.add(new_category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category added successfully',
            'category': new_category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===== ORDER MANAGEMENT =====
@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_all_orders():
    """Get all orders with optional status filter"""
    try:
        status = request.args.get('status')
        
        query = Orders.query
        
        if status:
            query = query.filter_by(status=status)
        
        orders = query.order_by(Orders.order_date.desc()).all()
        
        return jsonify({
            'orders': [order.to_dict() for order in orders],
            'count': len(orders)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    """Update order status"""
    try:
        order = Orders.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = ['Pending', 'Completed', 'Cancelled']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
        
        order.status = data['status']
        db.session.commit()
        
        return jsonify({
            'message': 'Order status updated successfully',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===== SALES REPORTS =====
@admin_bp.route('/reports/sales', methods=['GET'])
@jwt_required()
def get_sales_report():
    """Generate sales report"""
    try:
        # Get date range from query params
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Orders.query.filter_by(status='Completed')
        
        if start_date:
            query = query.filter(Orders.order_date >= start_date)
        if end_date:
            query = query.filter(Orders.order_date <= end_date)
        
        orders = query.all()
        
        # Calculate statistics
        total_revenue = sum(float(order.total_amount) for order in orders)
        total_orders = len(orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        return jsonify({
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'average_order_value': round(avg_order_value, 2),
            'orders': [order.to_dict() for order in orders]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== CUSTOMER MANAGEMENT =====
@admin_bp.route('/customers', methods=['GET'])
@jwt_required()
def get_all_customers():
    """Get all customers"""
    try:
        customers = Customer.query.all()
        
        return jsonify({
            'customers': [customer.to_dict() for customer in customers],
            'count': len(customers)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== REVIEW MANAGEMENT =====
@admin_bp.route('/reviews', methods=['GET'])
@jwt_required()
def get_all_reviews():
    """Get all reviews"""
    try:
        reviews = Review.query.order_by(Review.review_date.desc()).all()
        
        return jsonify({
            'reviews': [review.to_dict() for review in reviews],
            'count': len(reviews)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review_admin(review_id):
    """Delete a review (admin can delete any review)"""
    try:
        review = Review.query.get(review_id)
        
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        db.session.delete(review)
        db.session.commit()
        
        return jsonify({'message': 'Review deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500