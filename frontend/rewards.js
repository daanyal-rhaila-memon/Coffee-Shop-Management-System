// ===== MochaMagic Rewards System =====

// Initialize rewards page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Rewards page loaded');
  loadRewardsPage();
});

// Main function to load rewards page
function loadRewardsPage() {
  const currentUser = getCurrentUser();
  
  // Show loading animation briefly
  setTimeout(() => {
    document.getElementById('loadingRewards').style.display = 'none';
    
    if (currentUser) {
      // User is logged in - show personalized content
      showUserRewards(currentUser);
    } else {
      // User is not logged in - show guest view
      showGuestView();
    }
  }, 500);
}

// Display rewards for logged-in users
function showUserRewards(user) {
  // Update welcome message with user's name
  document.getElementById('welcomeMessage').textContent = `Welcome back, ${user.fullname}! ☕`;
  document.getElementById('rewardsSubtitle').textContent = `You're doing great! Keep earning points.`;
  
  // Show user rewards section
  document.getElementById('userRewards').style.display = 'block';
  
  // Display points (default to 0 if undefined)
  const points = user.rewards || 0;
  document.getElementById('userPoints').textContent = points;
  
  // Update progress bar
  updateProgressBar(points);
  
  // Load activity history
  loadActivityHistory(user);
}

// Display guest view for non-logged-in users
function showGuestView() {
  document.getElementById('guestRewards').style.display = 'block';
}

// Update the progress bar based on points
function updateProgressBar(points) {
  const maxPoints = 500;
  const percentage = Math.min((points / maxPoints) * 100, 100);
  
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  progressBar.style.width = percentage + '%';
  progressBar.setAttribute('aria-valuenow', points);
  progressText.textContent = `${points}/500`;
}

// Load user's activity history
function loadActivityHistory(user) {
  const activityList = document.getElementById('activityList');
  
  // Clear existing items
  activityList.innerHTML = '';
  
  const points = user.rewards || 0;
  
  // Check if user is new (account created recently)
  const isNewUser = user.createdAt && isWithinLast24Hours(user.createdAt);
  
  if (isNewUser) {
    activityList.innerHTML += '<li class="list-group-item">🎉 Welcome bonus: +50 points</li>';
  }
  
  // Show activity based on points
  if (points >= 100 && !isNewUser) {
    activityList.innerHTML += '<li class="list-group-item">☕ Purchase reward: +100 points</li>';
  }
  
  if (points >= 250) {
    activityList.innerHTML += '<li class="list-group-item">⭐ Loyal customer bonus: +50 points</li>';
  }
  
  // If no activity to show
  if (activityList.innerHTML === '') {
    activityList.innerHTML = '<li class="list-group-item text-muted">No activity yet. Start shopping to earn points!</li>';
  }
}

// Check if date is within last 24 hours
function isWithinLast24Hours(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const hoursDiff = (now - date) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

// Handle point redemption
function redeemPoints() {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    alert('Please login to redeem points!');
    window.location.href = 'login.html';
    return;
  }
  
  const points = currentUser.rewards || 0;
  
  if (points < 100) {
    showRewardsMessage('❌ You need at least 100 points to redeem rewards', 'error');
    return;
  }
  
  // Show redemption options
  const redemptionChoice = showRedemptionModal(points);
}

// Show redemption modal/options
function showRedemptionModal(points) {
  let options = 'Choose your reward:\n\n';
  
  if (points >= 100) {
    options += '1. PKR 50 off (100 points)\n';
  }
  if (points >= 250) {
    options += '2. Free coffee upgrade (250 points)\n';
  }
  if (points >= 500) {
    options += '3. Free drink of your choice (500 points)\n';
  }
  
  const choice = prompt(options + '\nEnter 1, 2, or 3:');
  
  if (choice === '1' && points >= 100) {
    processRedemption(100, 'PKR 50 off', 'MOCHA50');
  } else if (choice === '2' && points >= 250) {
    processRedemption(250, 'Free coffee upgrade', 'UPGRADE');
  } else if (choice === '3' && points >= 500) {
    processRedemption(500, 'Free drink', 'FREEDRINK');
  } else {
    showRewardsMessage('❌ Invalid choice or insufficient points', 'error');
  }
}

// Process the redemption
function processRedemption(pointsCost, rewardName, discountCode) {
  const currentUser = getCurrentUser();
  
  const confirmRedemption = confirm(
    `Redeem ${pointsCost} points for ${rewardName}?\n\nYour discount code will be: ${discountCode}`
  );
  
  if (confirmRedemption) {
    // Deduct points
    currentUser.rewards = (currentUser.rewards || 0) - pointsCost;
    
    // Update user in storage
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
      users[userIndex].rewards = currentUser.rewards;
      saveUsers(users);
    }
    
    // Update session
    localStorage.setItem('mochamagic_currentUser', JSON.stringify(currentUser));
    
    // Show success message
    showRewardsMessage(
      `✅ Congratulations! Your discount code: ${discountCode}\n\nShow this code at checkout!`,
      'success'
    );
    
    // Reload page after 3 seconds
    setTimeout(() => {
      location.reload();
    }, 3000);
  }
}

// ===== HELPER FUNCTIONS =====

function getCurrentUser() {
  const userJSON = localStorage.getItem('mochamagic_currentUser');
  return userJSON ? JSON.parse(userJSON) : null;
}

function getUsers() {
  const usersJSON = localStorage.getItem('mochamagic_users');
  return usersJSON ? JSON.parse(usersJSON) : [];
}

function saveUsers(users) {
  localStorage.setItem('mochamagic_users', JSON.stringify(users));
}

function showRewardsMessage(message, type) {
  // Remove any existing message
  const existingMsg = document.querySelector('.rewards-message');
  if (existingMsg) existingMsg.remove();
  
  // Create message element
  const msgDiv = document.createElement('div');
  msgDiv.className = `rewards-message alert alert-${type === 'error' ? 'danger' : 'success'}`;
  msgDiv.style.cssText = `
    position: fixed;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    min-width: 350px;
    max-width: 500px;
    text-align: center;
    padding: 15px 25px;
    font-size: 1.05rem;
    font-weight: 500;
    border-radius: 10px;
    animation: slideDown 0.4s ease;
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    white-space: pre-line;
  `;
  msgDiv.textContent = message;
  
  document.body.appendChild(msgDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    msgDiv.style.animation = 'slideUp 0.4s ease';
    setTimeout(() => msgDiv.remove(), 400);
  }, 5000);
}

// Add animation styles
if (!document.querySelector('#rewards-animations')) {
  const style = document.createElement('style');
  style.id = 'rewards-animations';
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translate(-50%, -30px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      to {
        opacity: 0;
        transform: translate(-50%, -30px);
      }
    }
  `;
  document.head.appendChild(style);
}