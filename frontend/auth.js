// ===== MochaMagic Authentication System =====

// Check if user is already logged in when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Script loaded!'); // Debug
  console.log('Current page:', window.location.pathname); // Debug
  
  updateNavbar();
  
  // Initialize forms if they exist on the page
  const signupForm = document.querySelector('.login-form[action="#"]');
  const loginForm = document.querySelector('.login-form[action="#"]');
  
  console.log('Signup form found:', signupForm); // Debug
  console.log('Login form found:', loginForm); // Debug
  
  if (window.location.pathname.includes('signup.html') && signupForm) {
    console.log('Initializing signup form...'); // Debug
    initSignupForm(signupForm);
    addPasswordMatchChecker(); // Add real-time password checking
  } else if (window.location.pathname.includes('login.html') && loginForm) {
    console.log('Initializing login form...'); // Debug
    initLoginForm(loginForm);
  }
});

// ===== REAL-TIME PASSWORD MATCH CHECKER =====
function addPasswordMatchChecker() {
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  
  if (!password || !confirmPassword) return;
  
  // Create match indicator
  const indicator = document.createElement('div');
  indicator.id = 'password-match-indicator';
  indicator.style.cssText = `
    margin-top: -10px;
    margin-bottom: 15px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
  `;
  confirmPassword.parentElement.appendChild(indicator);
  
  function checkPasswordMatch() {
    const pass = password.value;
    const confirmPass = confirmPassword.value;
    
    if (confirmPass === '') {
      indicator.textContent = '';
      confirmPassword.style.borderColor = '#cbb09c';
      return;
    }
    
    if (pass === confirmPass) {
      indicator.textContent = '✓ Passwords match';
      indicator.style.color = '#28a745';
      confirmPassword.style.borderColor = '#28a745';
    } else {
      indicator.textContent = '✗ Passwords do not match';
      indicator.style.color = '#dc3545';
      confirmPassword.style.borderColor = '#dc3545';
    }
  }
  
  password.addEventListener('input', checkPasswordMatch);
  confirmPassword.addEventListener('input', checkPasswordMatch);
}

// ===== SIGN UP FUNCTIONALITY =====
function initSignupForm(form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    console.log('Form submitted'); // Debug log
    
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    console.log('Password:', password); // Debug log
    console.log('Confirm Password:', confirmPassword); // Debug log
    console.log('Match?', password === confirmPassword); // Debug log
    
    // Validation
    if (!fullname || !email || !password || !confirmPassword) {
      showMessage('❌ Please fill in all fields', 'error');
      return;
    }
    
    if (!isValidEmail(email)) {
      showMessage('❌ Please enter a valid email address', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('❌ Password must be at least 6 characters long', 'error');
      return;
    }
    
    // CRITICAL: Check password match
    if (password !== confirmPassword) {
      console.log('Passwords do not match!'); // Debug log
      showMessage('❌ Passwords do not match!', 'error');
      // Highlight the fields
      document.getElementById('password').style.borderColor = '#dc3545';
      document.getElementById('confirmPassword').style.borderColor = '#dc3545';
      return;
    }
    
    console.log('All validations passed'); // Debug log
    
    // Check if user already exists
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      showMessage('❌ An account with this email already exists', 'error');
      return;
    }
    
    // Split full name into first and last name
    const nameParts = fullname.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create new user with additional fields for checkout
    const newUser = {
      id: Date.now(),
      fullname: fullname,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password, // In production, this should be hashed!
      phone: '',
      address: '',
      city: 'Karachi',
      postalCode: '',
      rewards: 0,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    showMessage('✅ Account created successfully! Redirecting to login...', 'success');
    
    // Clear form
    form.reset();
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  });
}

// ===== LOGIN FUNCTIONALITY =====
function initLoginForm(form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Validation
    if (!username || !password) {
      showMessage('❌ Please fill in all fields', 'error');
      return;
    }
    
    // Find user
    const users = getUsers();
    const user = users.find(u => u.email === username || u.fullname === username);
    
    if (!user) {
      showMessage('❌ Account not found', 'error');
      return;
    }
      
    if (user.password !== password) {
      showMessage('❌ Incorrect password', 'error');
      return;
    }
    
    // Login successful
    loginUser(user);
    showMessage('✅ Login successful! Welcome back, ' + user.fullname + '!', 'success');
    
    // Redirect to rewards page after 1.5 seconds
    setTimeout(() => {
      window.location.href = 'rewards.html';
    }, 1500);
  });
}

// ===== USER MANAGEMENT =====
function getUsers() {
  const usersJSON = localStorage.getItem('mochamagic_users');
  return usersJSON ? JSON.parse(usersJSON) : [];
}

function saveUsers(users) {
  localStorage.setItem('mochamagic_users', JSON.stringify(users));
}

function loginUser(user) {
  // Store complete user info for checkout (except password)
  const sessionUser = {
    id: user.id,
    fullname: user.fullname,
    firstName: user.firstName || user.fullname.split(' ')[0],
    lastName: user.lastName || user.fullname.split(' ').slice(1).join(' '),
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || 'Karachi',
    postalCode: user.postalCode || '',
    rewards: user.rewards
  };
  localStorage.setItem('mochamagic_currentUser', JSON.stringify(sessionUser));
}

function getCurrentUser() {
  const userJSON = localStorage.getItem('mochamagic_currentUser');
  return userJSON ? JSON.parse(userJSON) : null;
}

function logoutUser() {
  localStorage.removeItem('mochamagic_currentUser');
  showMessage('✅ Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ===== UPDATE USER PROFILE =====
function updateUserProfile(updatedData) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // Update in users list
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updatedData };
    saveUsers(users);
    
    // Update current session
    const updatedSessionUser = { ...currentUser, ...updatedData };
    delete updatedSessionUser.password; // Never store password in session
    localStorage.setItem('mochamagic_currentUser', JSON.stringify(updatedSessionUser));
    
    return true;
  }
  return false;
}

// ===== NAVBAR UPDATE =====
function updateNavbar() {
  const currentUser = getCurrentUser();
  const navLinks = document.querySelector('.navbar-nav');
  
  if (!navLinks) return;
  
  const loginItem = navLinks.querySelector('a[href="login.html"]')?.parentElement;
  
  if (currentUser && loginItem) {
    // User is logged in - replace Login with Profile/Logout
    loginItem.innerHTML = `
      <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
        ${currentUser.fullname}
      </a>
      <ul class="dropdown-menu">
        <li><a class="dropdown-item" href="rewards.html">My Rewards</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" onclick="logoutUser(); return false;">Logout</a></li>
      </ul>
    `;
  }
}

// ===== UTILITY FUNCTIONS =====
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showMessage(message, type) {
  // Remove any existing message
  const existingMsg = document.querySelector('.auth-message');
  if (existingMsg) existingMsg.remove();
  
  // Create message element
  const msgDiv = document.createElement('div');
  msgDiv.className = `auth-message alert alert-${type === 'error' ? 'danger' : 'success'}`;
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
if (!document.querySelector('#auth-animations')) {
  const style = document.createElement('style');
  style.id = 'auth-animations';
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
    .dropdown-menu {
      background-color: rgba(28, 20, 13, 0.95);
      border: 1px solid #d1a679;
    }
    .dropdown-item {
      color: #f5e8da;
    }
    .dropdown-item:hover {
      background-color: rgba(209, 166, 121, 0.2);
      color: #d1a679;
    }
    .alert-success {
      background-color: #28a745 !important;
      color: white !important;
      border: none;
    }
    .alert-danger {
      background-color: #dc3545 !important;
      color: white !important;
      border: none;
    }
  `;
  document.head.appendChild(style);
}