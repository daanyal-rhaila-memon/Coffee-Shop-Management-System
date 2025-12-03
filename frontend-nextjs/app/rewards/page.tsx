'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { rewardsAPI } from '@/lib/api';

export default function RewardsPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRewards();
  }, [user]);

  const loadRewards = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await rewardsAPI.get();
      setPoints(response.reward_points || user.reward_points || 0);
    } catch (error) {
      console.error('Error loading rewards:', error);
      setPoints(user.reward_points || 0);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = () => {
    if (!user) {
      alert('Please login to redeem points!');
      return;
    }

    const currentPoints = points || user.reward_points || 0;

    if (currentPoints < 100) {
      alert('❌ You need at least 100 points to redeem rewards');
      return;
    }

    // Show instructions on how to use points
    const instructions = `How to Redeem Your Reward Points:\n\n` +
      `1️. Shop - Browse our menu and add items to your cart\n` +
      `2️. Add to Cart - Select your favorite items\n` +
      `3️. Proceed to Checkout - Click checkout when ready\n` +
      `4️. Use Reward Points - Check the "Use Reward Points" option\n` +
      `5️. Enter Points - Specify how many points to redeem (minimum 100)\n` +
      `6️. Place Order - Your discount will be applied automatically!\n\n` +
      `Remember: 1 point = 1 PKR discount\n` +
      `You currently have ${currentPoints} points available.`;

    alert(instructions);
  };

  const currentPoints = points || user?.reward_points || 0;
  const maxPoints = 500;
  const percentage = Math.min((currentPoints / maxPoints) * 100, 100);

  if (loading) {
    return (
      <div className="rewards-box text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your rewards...</p>
      </div>
    );
  }

  return (
    <>
      <header className="text-center py-5">
        <h1 id="welcomeMessage">
          {user
            ? `Welcome back, ${user.name}! ☕`
            : 'Welcome to MochaMagic Rewards!'}
        </h1>
        <p id="rewardsSubtitle">
          {user
            ? "You're doing great! Keep earning points."
            : 'Earn points with every purchase and redeem them for exciting rewards.'}
        </p>
      </header>

      <section className="content text-center mb-5">
        <h2 className="rewards-title">Your Rewards</h2>
        <p className="rewards-subtext">Earn 1 point for every PKR 100 spent!</p>

        {user ? (
          <div className="rewards-box">
            <h3>
              Current Points:{' '}
              <span style={{ color: '#d1a679', fontSize: '2rem', fontWeight: 700 }}>
                {currentPoints}
              </span>
            </h3>
            <p className="mt-3">
              You can redeem your points for discounts on your next purchase.
            </p>

            <div className="mt-4">
              <small className="text-muted">Next reward at 500 points</small>
              <div className="progress mt-2" style={{ height: '25px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: '#d1a679',
                  }}
                  aria-valuenow={currentPoints}
                  aria-valuemin={0}
                  aria-valuemax={500}
                >
                  <span>{currentPoints}/500</span>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary mt-4" 
              onClick={handleRedeem}
              disabled={currentPoints < 100}
            >
              {currentPoints < 100 ? 'Need 100 Points to Redeem' : 'Redeem Now'}
            </button>
            {currentPoints < 100 && (
              <p className="text-muted mt-2 small">
                You need at least 100 points to redeem rewards. Keep shopping to earn more!
              </p>
            )}

            <div className="mt-5 text-start">
              <h5 style={{ color: '#4b2c20' }}>Recent Activity</h5>
              <ul className="list-group mt-3">
                {currentPoints >= 100 && (
                  <li className="list-group-item">☕ Purchase reward: +100 points</li>
                )}
                {currentPoints >= 250 && (
                  <li className="list-group-item">⭐ Loyal customer bonus: +50 points</li>
                )}
                {currentPoints === 0 && (
                  <li className="list-group-item text-muted">
                    No activity yet. Start shopping to earn points!
                  </li>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <div className="rewards-box">
            <h3>Join MochaMagic Rewards!</h3>
            <p className="mt-3">
              Create an account to start earning points with every purchase.
            </p>
            <div className="mt-4">
              <Link href="/signup" className="btn btn-primary me-2">
                Sign Up
              </Link>
              <Link href="/login" className="btn btn-outline-secondary">
                Login
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="container mb-5">
        <div className="row text-center">
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
              <div className="card-body">
                <h4 style={{ color: '#d1a679' }}>☕ 100 Points</h4>
                <p>PKR 50 off your next order</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
              <div className="card-body">
                <h4 style={{ color: '#d1a679' }}>☕ 250 Points</h4>
                <p>Free coffee upgrade</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
              <div className="card-body">
                <h4 style={{ color: '#d1a679' }}>☕ 500 Points</h4>
                <p>Free drink of your choice</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

