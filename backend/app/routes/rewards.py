# app/routes/rewards.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Customer, RewardTransaction

rewards_bp = Blueprint('rewards', __name__)

@rewards_bp.route('/', methods=['GET'])
@jwt_required()
def get_rewards():
    """Get customer's reward points and transaction history"""
    try:
        customer_id = get_jwt_identity()
        
        customer = Customer.query.get(customer_id)
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Get reward transactions
        transactions = RewardTransaction.query.filter_by(customer_id=customer_id)\
                                              .order_by(RewardTransaction.transaction_date.desc())\
                                              .all()
        
        return jsonify({
            'reward_points': customer.reward_points,
            'transactions': [t.to_dict() for t in transactions],
            'transactions_count': len(transactions)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rewards_bp.route('/redeem', methods=['POST'])
@jwt_required()
def redeem_points():
    """
    Redeem reward points for discount
    Points can be redeemed at 1 point = 1 PKR discount
    """
    try:
        customer_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate points
        if 'points' not in data or int(data['points']) <= 0:
            return jsonify({'error': 'Invalid points amount'}), 400
        
        points_to_redeem = int(data['points'])
        
        customer = Customer.query.get(customer_id)
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Check if customer has enough points
        if customer.reward_points < points_to_redeem:
            return jsonify({
                'error': f'Insufficient points. Available: {customer.reward_points}'
            }), 400
        
        # Deduct points
        customer.reward_points -= points_to_redeem
        
        # Record transaction
        reward_transaction = RewardTransaction(
            customer_id=customer_id,
            points_earned=0,
            points_redeemed=points_to_redeem,
            description=f'Redeemed {points_to_redeem} points for discount'
        )
        
        db.session.add(reward_transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Points redeemed successfully',
            'points_redeemed': points_to_redeem,
            'discount_amount': points_to_redeem,  # 1 point = 1 PKR
            'remaining_points': customer.reward_points
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
