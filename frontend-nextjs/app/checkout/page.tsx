'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ordersAPI, rewardsAPI } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

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

  const loadRewardPoints = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await rewardsAPI.get();
      setAvailablePoints(response.reward_points || user.reward_points || 0);
    } catch (error) {
      console.error('Error loading reward points:', error);
      setAvailablePoints(user.reward_points || 0);
    }
  }, [user]);

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

    // Load available reward points
    loadRewardPoints();
  }, [user, items, router, loadRewardPoints]);

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
        ...(usePoints && pointsToRedeem > 0 && { points_to_redeem: pointsToRedeem }),
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
      const pointsRedeemed = response.points_redeemed || 0;
      const discountAmount = response.discount_amount || 0;
      
      let message = `Order placed successfully!\nOrder ID: ${orderId}\n`;
      if (pointsRedeemed > 0) {
        message += `Points Redeemed: ${pointsRedeemed} (Discount: ${discountAmount} PKR)\n`;
      }
      message += `Points Earned: ${pointsEarned}\n\nThank you for your order!`;
      alert(message);
      
      // Reload points after order
      if (pointsRedeemed > 0) {
        loadRewardPoints();
      }

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
  const discount = usePoints && pointsToRedeem > 0 ? pointsToRedeem : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // Adjust pointsToRedeem if subtotal changes and it exceeds the new maximum
  useEffect(() => {
    if (usePoints && pointsToRedeem > 0) {
      const maxRedeemable = Math.min(availablePoints, Math.floor(subtotal + deliveryFee));
      const minPoints = 100;
      if (maxRedeemable < minPoints) {
        // If max is less than minimum, disable points redemption
        setUsePoints(false);
        setPointsToRedeem(0);
      } else if (pointsToRedeem > maxRedeemable) {
        // Adjust to max if current value exceeds new maximum
        setPointsToRedeem(maxRedeemable);
      } else if (pointsToRedeem < minPoints) {
        // Ensure minimum if somehow it's below minimum
        setPointsToRedeem(minPoints);
      }
    }
  }, [subtotal, deliveryFee, availablePoints, usePoints, pointsToRedeem]);

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const maxPoints = Math.min(availablePoints, Math.floor(subtotal + deliveryFee));
    // Ensure minimum 100 points if redeeming
    const minPoints = 100;
    const finalValue = Math.min(Math.max(minPoints, value), maxPoints);
    setPointsToRedeem(finalValue);
  };

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
              
              {availablePoints > 0 && (
                <>
                  <hr />
                  <div className="mb-3">
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="usePoints"
                        checked={usePoints}
                        disabled={availablePoints < 100}
                        onChange={(e) => {
                          setUsePoints(e.target.checked);
                          if (!e.target.checked) {
                            setPointsToRedeem(0);
                          } else {
                            const maxRedeemable = Math.min(availablePoints, Math.floor(subtotal + deliveryFee));
                            // Set minimum 100 points when enabling
                            const minPoints = 100;
                            // If pointsToRedeem is 0 or less, set to minimum, otherwise keep current value (clamped to max)
                            const initialValue = pointsToRedeem > 0 ? pointsToRedeem : minPoints;
                            setPointsToRedeem(Math.min(Math.max(minPoints, initialValue), maxRedeemable));
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor="usePoints">
                        <strong>Use Reward Points</strong>
                        <br />
                        <small className="text-muted">
                          Available: {availablePoints} points (1 point = 1 PKR)
                        </small>
                      </label>
                    </div>
                    {availablePoints < 100 && (
                      <div className="alert alert-info mt-2 mb-0 py-2" style={{ fontSize: '0.875rem' }}>
                        <small>
                          <strong>Note:</strong> You need at least 100 points to redeem rewards. 
                          You currently have {availablePoints} points. Keep shopping to earn more!
                        </small>
                      </div>
                    )}
                    {usePoints && availablePoints >= 100 && (
                      <div className="mt-2">
                        <label className="form-label small">Points to redeem (minimum 100):</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          min="100"
                          max={Math.min(availablePoints, Math.floor(subtotal + deliveryFee))}
                          value={pointsToRedeem}
                          onChange={handlePointsChange}
                          placeholder="Enter points (min 100)"
                        />
                        <small className="text-muted">
                          Max: {Math.min(availablePoints, Math.floor(subtotal + deliveryFee))} points
                        </small>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {discount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount (Points Redeemed)</span>
                  <span>-{discount} PKR</span>
                </div>
              )}
              
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

