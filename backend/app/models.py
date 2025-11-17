# app/models.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Customer(db.Model):
    __tablename__ = 'Customer'
    
    customer_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(255))
    reward_points = db.Column(db.Integer, default=0)
    
    # Relationships
    orders = db.relationship('Orders', backref='customer', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='customer', cascade='all, delete-orphan')
    reward_transactions = db.relationship('RewardTransaction', backref='customer', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'customer_id': self.customer_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'reward_points': self.reward_points
        }


class Category(db.Model):
    __tablename__ = 'Category'
    
    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_name = db.Column(db.String(100), unique=True, nullable=False)
    
    # Relationships
    products = db.relationship('Product', backref='category')
    
    def to_dict(self):
        return {
            'category_id': self.category_id,
            'category_name': self.category_name
        }


class Product(db.Model):
    __tablename__ = 'Product'
    
    product_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('Category.category_id', onupdate='CASCADE', ondelete='SET NULL'))
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255))
    
    # Relationships
    order_details = db.relationship('OrderDetails', backref='product')
    reviews = db.relationship('Review', backref='product', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'product_id': self.product_id,
            'name': self.name,
            'category_id': self.category_id,
            'category_name': self.category.category_name if self.category else None,
            'description': self.description,
            'price': float(self.price),
            'stock_quantity': self.stock_quantity,
            'image_url': self.image_url
        }


class Orders(db.Model):
    __tablename__ = 'Orders'
    
    order_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('Customer.customer_id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.Enum('Pending', 'Completed', 'Cancelled'), default='Pending')
    
    # Relationships
    order_details = db.relationship('OrderDetails', backref='order', cascade='all, delete-orphan')
    payment = db.relationship('Payment', backref='order', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'order_id': self.order_id,
            'customer_id': self.customer_id,
            'order_date': self.order_date.isoformat(),
            'total_amount': float(self.total_amount),
            'status': self.status,
            'items': [detail.to_dict() for detail in self.order_details]
        }


class OrderDetails(db.Model):
    __tablename__ = 'OrderDetails'
    
    order_detail_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('Product.product_id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    
    def to_dict(self):
        return {
            'order_detail_id': self.order_detail_id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
            'subtotal': float(self.subtotal)
        }


class Payment(db.Model):
    __tablename__ = 'Payment'
    
    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id', onupdate='CASCADE', ondelete='CASCADE'), unique=True, nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    payment_method = db.Column(db.Enum('CreditCard', 'Cash', 'Online'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.Enum('Paid', 'Pending', 'Refunded'), default='Pending')
    
    def to_dict(self):
        return {
            'payment_id': self.payment_id,
            'order_id': self.order_id,
            'payment_date': self.payment_date.isoformat(),
            'payment_method': self.payment_method,
            'amount': float(self.amount),
            'status': self.status
        }


class Review(db.Model):
    __tablename__ = 'Review'
    
    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('Customer.customer_id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('Product.product_id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    review_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    )
    
    def to_dict(self):
        return {
            'review_id': self.review_id,
            'customer_id': self.customer_id,
            'customer_name': self.customer.name if self.customer else None,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'rating': self.rating,
            'comment': self.comment,
            'review_date': self.review_date.isoformat()
        }


class RewardTransaction(db.Model):
    __tablename__ = 'RewardTransaction'
    
    reward_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('Customer.customer_id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)
    points_earned = db.Column(db.Integer, default=0)
    points_redeemed = db.Column(db.Integer, default=0)
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'reward_id': self.reward_id,
            'customer_id': self.customer_id,
            'points_earned': self.points_earned,
            'points_redeemed': self.points_redeemed,
            'transaction_date': self.transaction_date.isoformat(),
            'description': self.description
        }


class Admin(db.Model):
    __tablename__ = 'Admin'
    
    admin_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('Manager', 'Staff'), default='Staff')
    
    def to_dict(self):
        return {
            'admin_id': self.admin_id,
            'username': self.username,
            'role': self.role
        }