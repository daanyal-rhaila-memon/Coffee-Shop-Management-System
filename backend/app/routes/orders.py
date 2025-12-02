# app/routes/orders.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Orders, OrderDetails, Payment, Product, Customer, RewardTransaction
from decimal import Decimal
from datetime import datetime

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['OPTIONS'], strict_slashes=False)
def handle_options():
    """Handle CORS preflight requests"""
    return '', 200

@orders_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_order():
    """
    Create a new order with transaction handling
    - Updates stock
    - Creates order and order details
    - Records payment
    - Awards reward points
    """
    print("create_order", request.get_json())
    try:
        customer_id = int(get_jwt_identity())  # Convert string to int
        data = request.get_json()
        
        # Validate required fields
        if not data.get('items') or len(data['items']) == 0:
            return jsonify({'error': 'Order must contain at least one item'}), 400
        
        if not data.get('payment_method'):
            return jsonify({'error': 'Payment method is required'}), 400
        
        # Start transaction
        try:
            total_amount = Decimal('0.00')
            order_items = []
            
            # Validate items and calculate total
            for item in data['items']:
                product = Product.query.get(item['product_id'])
                
                if not product:
                    return jsonify({'error': f'Product {item["product_id"]} not found'}), 404
                
                quantity = int(item['quantity'])
                
                # Check stock availability
                if product.stock_quantity < quantity:
                    return jsonify({
                        'error': f'Insufficient stock for {product.name}. Available: {product.stock_quantity}'
                    }), 400
                
                subtotal = product.price * quantity
                total_amount += subtotal
                
                order_items.append({
                    'product': product,
                    'quantity': quantity,
                    'subtotal': subtotal
                })
            
            # Add delivery fee if specified
            delivery_fee = Decimal(str(data.get('delivery_fee', 0)))
            total_amount += delivery_fee
            
            # Create order
            new_order = Orders(
                customer_id=customer_id,
                total_amount=total_amount,
                status='Pending'
            )
            db.session.add(new_order)
            db.session.flush()  # Get order_id without committing
            
            # Create order details and update stock
            for item in order_items:
                order_detail = OrderDetails(
                    order_id=new_order.order_id,
                    product_id=item['product'].product_id,
                    quantity=item['quantity'],
                    subtotal=item['subtotal']
                )
                db.session.add(order_detail)
                
                # Update product stock
                item['product'].stock_quantity -= item['quantity']
            
            # Create payment record
            payment = Payment(
                order_id=new_order.order_id,
                payment_method=data['payment_method'],
                amount=total_amount,
                status='Pending' if data['payment_method'] == 'Cash' else 'Paid'
            )
            db.session.add(payment)
            
            # Calculate and award reward points (1 point per 100 PKR)
            points_earned = int(total_amount / 100)
            
            if points_earned > 0:
                # Update customer reward points
                customer = Customer.query.get(customer_id)
                customer.reward_points += points_earned
                
                # Record reward transaction
                reward_transaction = RewardTransaction(
                    customer_id=customer_id,
                    points_earned=points_earned,
                    points_redeemed=0,
                    description=f'Points earned from Order #{new_order.order_id}'
                )
                db.session.add(reward_transaction)
            
            # Commit transaction
            db.session.commit()
            
            return jsonify({
                'message': 'Order placed successfully',
                'order': new_order.to_dict(),
                'points_earned': points_earned
            }), 201
            
        except Exception as e:
            db.session.rollback()
            raise e
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@orders_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_customer_orders():
    """Get all orders for the logged-in customer"""
    try:
        customer_id = int(get_jwt_identity())  # Convert string to int
        
        orders = Orders.query.filter_by(customer_id=customer_id)\
                             .order_by(Orders.order_date.desc())\
                             .all()
        
        return jsonify({
            'orders': [order.to_dict() for order in orders],
            'count': len(orders)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_details(order_id):
    """Get details of a specific order"""
    try:
        customer_id = int(get_jwt_identity())  # Convert string to int
        
        order = Orders.query.filter_by(
            order_id=order_id,
            customer_id=customer_id
        ).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify({'order': order.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@orders_bp.route('/<int:order_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_order(order_id):
    """Cancel an order (only if status is Pending)"""
    try:
        customer_id = int(get_jwt_identity())  # Convert string to int
        
        order = Orders.query.filter_by(
            order_id=order_id,
            customer_id=customer_id
        ).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        if order.status != 'Pending':
            return jsonify({'error': 'Only pending orders can be cancelled'}), 400
        
        # Start transaction to restore stock
        try:
            # Restore product stock
            for detail in order.order_details:
                product = Product.query.get(detail.product_id)
                if product:
                    product.stock_quantity += detail.quantity
            
            # Update order status
            order.status = 'Cancelled'
            
            # Update payment status
            if order.payment:
                order.payment.status = 'Refunded'
            
            # Deduct reward points if they were earned
            points_to_deduct = int(order.total_amount / 100)
            if points_to_deduct > 0:
                customer = Customer.query.get(customer_id)
                customer.reward_points = max(0, customer.reward_points - points_to_deduct)
                
                reward_transaction = RewardTransaction(
                    customer_id=customer_id,
                    points_earned=0,
                    points_redeemed=points_to_deduct,
                    description=f'Points deducted due to Order #{order_id} cancellation'
                )
                db.session.add(reward_transaction)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Order cancelled successfully',
                'order': order.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            raise e
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500