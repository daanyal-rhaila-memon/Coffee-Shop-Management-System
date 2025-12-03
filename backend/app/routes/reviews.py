# app/routes/reviews.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Review, Product, Customer

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/', methods=['GET'], strict_slashes=False)
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


@reviews_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_review():
    """Submit a product review"""
    try:
        customer_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['product_id', 'rating']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate rating
        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Check if product exists
        product = Product.query.get(data['product_id'])
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Check if customer already reviewed this product
        existing_review = Review.query.filter_by(
            customer_id=customer_id,
            product_id=data['product_id']
        ).first()
        
        if existing_review:
            return jsonify({'error': 'You have already reviewed this product'}), 400
        
        # Create review
        new_review = Review(
            customer_id=customer_id,
            product_id=data['product_id'],
            rating=rating,
            comment=data.get('comment', '')
        )
        
        db.session.add(new_review)
        db.session.commit()
        
        return jsonify({
            'message': 'Review submitted successfully',
            'review': new_review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reviews_bp.route('/product/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    """Get all reviews for a specific product"""
    try:
        # Check if product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        reviews = Review.query.filter_by(product_id=product_id)\
                              .order_by(Review.review_date.desc())\
                              .all()
        
        # Calculate average rating
        avg_rating = 0
        if reviews:
            avg_rating = sum(review.rating for review in reviews) / len(reviews)
        
        return jsonify({
            'product_id': product_id,
            'product_name': product.name,
            'reviews': [review.to_dict() for review in reviews],
            'count': len(reviews),
            'average_rating': round(avg_rating, 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reviews_bp.route('/customer', methods=['GET'])
@jwt_required()
def get_customer_reviews():
    """Get all reviews by the logged-in customer"""
    try:
        customer_id = get_jwt_identity()
        
        reviews = Review.query.filter_by(customer_id=customer_id)\
                              .order_by(Review.review_date.desc())\
                              .all()
        
        return jsonify({
            'reviews': [review.to_dict() for review in reviews],
            'count': len(reviews)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reviews_bp.route('/<int:review_id>', methods=['PUT'])
@jwt_required()
def update_review(review_id):
    """Update a review (only by the review author)"""
    try:
        customer_id = get_jwt_identity()
        
        review = Review.query.filter_by(
            review_id=review_id,
            customer_id=customer_id
        ).first()
        
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        data = request.get_json()
        
        # Update rating if provided
        if 'rating' in data:
            rating = int(data['rating'])
            if rating < 1 or rating > 5:
                return jsonify({'error': 'Rating must be between 1 and 5'}), 400
            review.rating = rating
        
        # Update comment if provided
        if 'comment' in data:
            review.comment = data['comment']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Review updated successfully',
            'review': review.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """Delete a review (only by the review author)"""
    try:
        customer_id = get_jwt_identity()
        
        review = Review.query.filter_by(
            review_id=review_id,
            customer_id=customer_id
        ).first()
        
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        db.session.delete(review)
        db.session.commit()
        
        return jsonify({'message': 'Review deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500