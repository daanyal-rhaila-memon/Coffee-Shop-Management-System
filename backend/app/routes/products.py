# app/routes/products.py
from flask import Blueprint, request, jsonify
from app.models import db, Product, Category
from sqlalchemy import or_

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET'])
def get_all_products():
    """Get all products with optional filtering"""
    try:
        # Get query parameters
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        # Base query
        query = Product.query
        
        # Apply filters
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.description.ilike(f'%{search}%')
                )
            )
        
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        # Execute query
        products = query.all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'count': len(products)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID"""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'product': product.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all product categories"""
    try:
        categories = Category.query.all()
        
        return jsonify({
            'categories': [category.to_dict() for category in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/category/<int:category_id>', methods=['GET'])
def get_products_by_category(category_id):
    """Get all products in a specific category"""
    try:
        category = Category.query.get(category_id)
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        products = Product.query.filter_by(category_id=category_id).all()
        
        return jsonify({
            'category': category.to_dict(),
            'products': [product.to_dict() for product in products],
            'count': len(products)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Get featured/popular products (top 8 by stock or custom logic)"""
    try:
        # Get products with highest stock (you can customize this logic)
        products = Product.query.filter(Product.stock_quantity > 0)\
                                 .order_by(Product.stock_quantity.desc())\
                                 .limit(8)\
                                 .all()
        
        return jsonify({
            'products': [product.to_dict() for product in products]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500