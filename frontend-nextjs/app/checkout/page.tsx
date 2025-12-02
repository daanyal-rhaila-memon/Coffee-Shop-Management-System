'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ordersAPI } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Karachi',
    postalCode: '',
    orderNotes: '',
    paymentMethod: 'cod',
  });

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      alert('Please login to continue with checkout');
      router.push('/login');
      return;
    }

    // Check if cart is empty
    if (items.length === 0) {
      alert('Your cart is empty!');
      router.push('/menu');
      return;
    }

    // Pre-fill form with user data
    if (user) {
      // Split name if it contains space
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: 'Karachi', // Default city
        postalCode: '',
        orderNotes: '',
        paymentMethod: 'cod',
      });
    }
  }, [user, items, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate user is logged in
      if (!user) {
        setError('You must be logged in to place an order');
        router.push('/login');
        return;
      }

      // Validate cart has items
      if (items.length === 0) {
        setError('Your cart is empty');
        router.push('/menu');
        return;
      }

      // Validate cart items have product IDs
      const invalidItems = items.filter(item => !item.id || item.id === 0);
      if (invalidItems.length > 0) {
        setError(`Invalid items in cart: ${invalidItems.map(i => i.name).join(', ')}. Please remove them and try again.`);
        setLoading(false);
        return;
      }

      // Prepare order data - map payment method to backend enum
      const paymentMethodMap: { [key: string]: string } = {
        cod: 'Cash',
        card: 'CreditCard',
        easypaisa: 'Online',
      };

      // Map cart items to order items - ensure product_id is valid
      const orderItems = items.map((item) => {
        if (!item.id || item.id === 0) {
          throw new Error(`Invalid product ID for item: ${item.name}`);
        }
        return {
          product_id: item.id,
          quantity: item.quantity,
          price: Number(item.price), // Ensure it's a number
        };
      });

      const orderData = {
        items: orderItems,
        payment_method: paymentMethodMap[formData.paymentMethod] || 'Cash',
        delivery_fee: 150,
      };

      console.log('Submitting order with data:', JSON.stringify(orderData, null, 2));
      console.log('Cart items:', items);

      // Create order via API
      const response = await ordersAPI.create(orderData);

      console.log('Order response:', response);

      // Clear cart
      clearCart();

      // Show success message
      const orderId = response.order?.order_id || response.order_id || 'N/A';
      const pointsEarned = response.points_earned || 0;
      alert(
        `Order placed successfully!\nOrder ID: ${orderId}\nPoints Earned: ${pointsEarned}\n\nThank you for your order!`
      );

      // Redirect to home
      router.push('/');
    } catch (error: any) {
      console.error('Error placing order:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getTotalPrice();
  const deliveryFee = 150;
  const total = subtotal + deliveryFee;

  return (
    <>
      <header className="cart-header text-center py-5">
        <h1 className="cart-title">Checkout</h1>
        <p className="cart-subtitle">Complete your order</p>
      </header>

      <section className="container my-5">
        <div className="row">
          <div className="col-lg-7">
            <div className="card shadow-sm p-4 mb-4">
              <h4 className="mb-4">Delivery Information</h4>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form id="checkoutForm" onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Delivery Address *</label>
                  <textarea
                    className="form-control"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Order Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    name="orderNotes"
                    rows={2}
                    placeholder="Any special instructions..."
                    value={formData.orderNotes}
                    onChange={handleInputChange}
                  />
                </div>

                <h4 className="mb-3">Payment Method</h4>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="cod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="cod">
                    Cash on Delivery
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="card"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    disabled
                  />
                  <label className="form-check-label" htmlFor="card">
                    Credit/Debit Card (Coming Soon)
                  </label>
                </div>
                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="easypaisa"
                    value="easypaisa"
                    checked={formData.paymentMethod === 'easypaisa'}
                    onChange={handleInputChange}
                    disabled
                  />
                  <label className="form-check-label" htmlFor="easypaisa">
                    Easypaisa/JazzCash (Coming Soon)
                  </label>
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm p-4 position-sticky" style={{ top: '100px' }}>
              <h4 className="mb-4">Order Summary</h4>

              <div className="mb-3">
                {items.map((item) => (
                  <div
                    key={item.name}
                    className="d-flex justify-content-between align-items-center mb-2"
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <br />
                      <small className="text-muted">
                        {item.quantity} × {item.price} PKR
                      </small>
                    </div>
                    <span>{item.price * item.quantity} PKR</span>
                  </div>
                ))}
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>{subtotal} PKR</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery Fee</span>
                <span>150 PKR</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <strong>Total</strong>
                <strong style={{ color: '#d1a679' }}>{total} PKR</strong>
              </div>

              <button
                type="submit"
                form="checkoutForm"
                className="btn btn-primary w-100 mb-2"
                disabled={loading}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => router.push('/cart')}
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

