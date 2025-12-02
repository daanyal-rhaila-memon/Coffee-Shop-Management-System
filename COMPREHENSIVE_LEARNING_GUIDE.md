# Complete Learning Guide: Coffee Shop Management System

## Table of Contents
1. [Project Overview](#project-overview)
2. [Understanding Web Applications](#understanding-web-applications)
3. [Backend Fundamentals](#backend-fundamentals)
4. [Frontend Fundamentals](#frontend-fundamentals)
5. [How Frontend and Backend Communicate](#how-frontend-and-backend-communicate)
6. [Project Structure Deep Dive](#project-structure-deep-dive)
7. [Step-by-Step Feature Walkthrough](#step-by-step-feature-walkthrough)
8. [Key Concepts Explained](#key-concepts-explained)
9. [Practice Exercises](#practice-exercises)

---

## Project Overview

### What is This Project?
This is a **Coffee Shop Management System** called "MochaMagic" - a full-stack web application that allows customers to:
- Browse coffee products
- Add items to a shopping cart
- Place orders
- Leave reviews
- Earn and redeem reward points
- Manage their profile

### Technology Stack
- **Backend**: Python with Flask (REST API)
- **Frontend**: Next.js (React framework) with TypeScript
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)

---

## Understanding Web Applications

### What is a Web Application?
A web application is software that runs in a web browser. Unlike traditional desktop applications, web apps are accessed through URLs (like `http://localhost:3000`).

### Client-Server Architecture
```
┌─────────────┐         HTTP Requests         ┌─────────────┐
│   Browser   │ ────────────────────────────> │   Server    │
│  (Frontend) │                                │  (Backend)  │
│             │ <──────────────────────────── │             │
│             │      JSON Responses           │             │
└─────────────┘                                └─────────────┘
```

**Frontend (Client)**: What users see and interact with
- Runs in the browser
- Built with HTML, CSS, JavaScript/TypeScript
- Makes requests to the backend

**Backend (Server)**: The "brain" that processes requests
- Runs on a server
- Handles business logic
- Manages database
- Returns data to frontend

### Example Flow
1. User clicks "Add to Cart" button (Frontend)
2. Frontend sends request to backend: `POST /api/orders`
3. Backend processes request, saves to database
4. Backend sends response: `{ "success": true }`
5. Frontend updates the UI to show item in cart

---

## Backend Fundamentals

### What is a Backend?
The backend is the server-side of the application. It:
- Receives requests from the frontend
- Processes business logic
- Interacts with the database
- Returns responses

### Flask Framework

#### What is Flask?
Flask is a Python web framework that makes it easy to build web APIs (Application Programming Interfaces).

**Think of Flask like a restaurant:**
- **Routes** = Menu items (different endpoints)
- **Functions** = Chefs (process requests)
- **Database** = Pantry (stores data)

#### Basic Flask Structure
```python
from flask import Flask

app = Flask(__name__)

@app.route('/hello')
def hello():
    return {'message': 'Hello World'}

if __name__ == '__main__':
    app.run(port=5000)
```

**Explanation:**
- `@app.route('/hello')` - Defines a URL endpoint
- `def hello()` - Function that handles requests to that endpoint
- Returns JSON data (dictionary in Python becomes JSON)

### Our Backend Structure

#### 1. Application Initialization (`backend/app/__init__.py`)

**What it does:**
- Creates the Flask application
- Configures database connection
- Sets up CORS (allows frontend to communicate)
- Registers all route blueprints
- Initializes JWT for authentication

**Key Concepts:**

**Application Factory Pattern:**
```python
def create_app():
    app = Flask(__name__)
    # Configure app
    return app
```
- Why? Allows creating multiple app instances for testing
- Makes configuration flexible

**CORS (Cross-Origin Resource Sharing):**
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"]
    }
})
```
- **Problem**: Browsers block requests from different origins (security)
- **Solution**: CORS allows our frontend (port 3000) to talk to backend (port 5000)

**Blueprints:**
```python
app.register_blueprint(auth_bp, url_prefix='/api/auth')
```
- Organizes routes into modules
- `/api/auth/login` → handled by `auth_bp`
- `/api/orders` → handled by `orders_bp`

#### 2. Database Models (`backend/app/models.py`)

**What are Models?**
Models represent database tables. Each class = one table.

**Example: Customer Model**
```python
class Customer(db.Model):
    customer_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(255))
```

**Key Concepts:**

**Primary Key**: Unique identifier (`customer_id`)
**Foreign Key**: Reference to another table
```python
customer_id = db.Column(db.Integer, db.ForeignKey('Customer.customer_id'))
```

**Relationships:**
```python
orders = db.relationship('Orders', backref='customer')
```
- One Customer can have many Orders
- Access orders: `customer.orders`
- Access customer from order: `order.customer`

**to_dict() Method:**
Converts database objects to dictionaries (JSON):
```python
def to_dict(self):
    return {
        'customer_id': self.customer_id,
        'name': self.name
    }
```

#### 3. Routes (API Endpoints)

**What are Routes?**
Routes are URLs that the backend responds to. Each route handles a specific action.

**Route Structure:**
```python
@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    # Handle POST request to /api/orders
```

**HTTP Methods:**
- `GET` - Retrieve data (read)
- `POST` - Create new data
- `PUT` - Update existing data
- `DELETE` - Remove data

**Example: Creating an Order**

Let's trace through `orders.py` - `create_order()`:

```python
@orders_bp.route('/', methods=['POST'])
@jwt_required()  # Requires authentication
def create_order():
    # 1. Get customer ID from JWT token
    customer_id = int(get_jwt_identity())
    
    # 2. Get data from request
    data = request.get_json()
    # data = {
    #     'items': [{'product_id': 1, 'quantity': 2}],
    #     'payment_method': 'Cash'
    # }
    
    # 3. Validate items
    for item in data['items']:
        product = Product.query.get(item['product_id'])
        # Check if product exists and has stock
    
    # 4. Calculate total
    total_amount = Decimal('0.00')
    for item in order_items:
        total_amount += item['subtotal']
    
    # 5. Create order in database
    new_order = Orders(
        customer_id=customer_id,
        total_amount=total_amount,
        status='Pending'
    )
    db.session.add(new_order)
    
    # 6. Save to database
    db.session.commit()
    
    # 7. Return response
    return jsonify({'order': new_order.to_dict()}), 201
```

**Key Concepts:**

**Database Transactions:**
```python
try:
    # Make changes
    db.session.add(new_order)
    db.session.commit()  # Save changes
except:
    db.session.rollback()  # Undo if error
```
- Ensures data consistency
- If any step fails, all changes are undone

**JWT Authentication:**
```python
@jwt_required()
def create_order():
    customer_id = get_jwt_identity()
```
- `@jwt_required()` - Decorator that checks for valid token
- Token is sent in header: `Authorization: Bearer <token>`
- Extracts user ID from token

#### 4. Authentication (`backend/app/routes/auth.py`)

**Registration Flow:**
```python
@auth_bp.route('/register', methods=['POST'])
def register():
    # 1. Get user data
    data = request.get_json()
    
    # 2. Check if email exists
    if Customer.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email exists'}), 400
    
    # 3. Hash password (NEVER store plain passwords!)
    hashed_password = bcrypt.hashpw(
        data['password'].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')
    
    # 4. Create customer
    new_customer = Customer(
        name=data['name'],
        email=data['email'],
        password=hashed_password  # Store hashed, not plain!
    )
    db.session.add(new_customer)
    db.session.commit()
```

**Login Flow:**
```python
@auth_bp.route('/login', methods=['POST'])
def login():
    # 1. Find customer by email
    customer = Customer.query.filter_by(email=data['email']).first()
    
    # 2. Verify password
    if bcrypt.checkpw(password, customer.password):
        # 3. Create JWT token
        token = create_access_token(identity=str(customer.customer_id))
        return jsonify({'access_token': token})
```

**Password Hashing:**
- **Never** store passwords in plain text!
- `bcrypt` creates a one-way hash
- Can verify passwords but can't reverse the hash
- Example: `"password123"` → `"$2b$12$xyz..."` (always different)

---

## Frontend Fundamentals

### What is a Frontend?
The frontend is what users see and interact with in their browser. It's built with:
- **HTML** - Structure
- **CSS** - Styling
- **JavaScript/TypeScript** - Interactivity

### React Framework

#### What is React?
React is a JavaScript library for building user interfaces. It uses **components** - reusable pieces of UI.

**Component Example:**
```tsx
function Button() {
  return <button>Click Me</button>;
}
```

**Component with State:**
```tsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

**Key Concepts:**
- **State**: Data that can change (like `count`)
- **Props**: Data passed to components
- **Hooks**: Functions like `useState`, `useEffect`

### Next.js Framework

#### What is Next.js?
Next.js is a React framework that adds:
- **Routing**: Automatic routing based on file structure
- **Server-side rendering**: Better performance
- **API routes**: Can create backend endpoints
- **File-based routing**: `app/page.tsx` = homepage

#### Next.js App Router Structure
```
app/
  page.tsx          → Homepage (/)
  login/
    page.tsx        → Login page (/login)
  menu/
    page.tsx        → Menu page (/menu)
```

**File = Route:**
- `app/page.tsx` → `http://localhost:3000/`
- `app/login/page.tsx` → `http://localhost:3000/login`

### Our Frontend Structure

#### 1. Pages (`frontend-nextjs/app/`)

**What are Pages?**
Pages are React components that represent different routes/URLs.

**Example: Homepage (`app/page.tsx`)**
```tsx
export default function Home() {
  return (
    <>
      <header className="hero-section">
        <h1>Welcome to MochaMagic</h1>
        <Link href="/menu">Explore Menu</Link>
      </header>
    </>
  );
}
```

**Key Concepts:**
- `export default` - Makes it the page component
- `Link` - Next.js component for navigation (better than `<a>`)
- JSX - JavaScript XML (HTML-like syntax in JavaScript)

#### 2. Components (`frontend-nextjs/components/`)

**What are Components?**
Reusable pieces of UI. Like functions, but for UI.

**Example: Navbar Component**
```tsx
export default function Navbar() {
  const { user, logout } = useAuth();
  
  return (
    <nav>
      {user ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </nav>
  );
}
```

**Why Components?**
- Reusable (use Navbar on every page)
- Organized (separate file)
- Maintainable (change once, updates everywhere)

#### 3. Context (`frontend-nextjs/context/`)

**What is Context?**
Context provides a way to share data across components without passing props.

**Problem Context Solves:**
```tsx
// Without Context - prop drilling
<App>
  <Navbar user={user} />
  <Page user={user} />
  <Footer user={user} />
</App>
```

**With Context:**
```tsx
// Wrap app with provider
<AuthProvider>
  <App />  {/* Any component can access user */}
</AuthProvider>

// In any component
const { user } = useAuth();  // No props needed!
```

**AuthContext Example:**
```tsx
// 1. Create context
const AuthContext = createContext();

// 2. Create provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    setUser(response.user);
  };
  
  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Create hook to use context
export function useAuth() {
  return useContext(AuthContext);
}
```

**CartContext:**
- Manages shopping cart state
- Persists to localStorage (survives page refresh)
- Provides: `addItem`, `removeItem`, `getTotalPrice`

#### 4. API Client (`frontend-nextjs/lib/api.ts`)

**What is an API Client?**
A module that handles all communication with the backend.

**Axios Setup:**
```tsx
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Request Interceptor:**
```tsx
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
- Automatically adds JWT token to every request
- No need to manually add token each time

**Response Interceptor:**
```tsx
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```
- Handles authentication errors globally
- Redirects to login if token is invalid

**API Functions:**
```tsx
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },
  
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  }
};
```

#### 5. Checkout Page Example (`frontend-nextjs/app/checkout/page.tsx`)

**Complete Flow Analysis:**

```tsx
export default function CheckoutPage() {
  // 1. Get data from contexts
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  // 2. State for form data
  const [formData, setFormData] = useState({
    firstName: '',
    paymentMethod: 'cod',
    // ... more fields
  });
  
  // 3. Pre-fill form when component loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.name.split(' ')[0],
        email: user.email,
        // ...
      });
    }
  }, [user]);
  
  // 4. Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // Prevent page refresh
    
    // 5. Prepare order data
    const orderItems = items.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));
    
    const orderData = {
      items: orderItems,
      payment_method: 'Cash',
      delivery_fee: 150
    };
    
    // 6. Send to backend
    try {
      const response = await ordersAPI.create(orderData);
      clearCart();  // Clear cart on success
      alert('Order placed!');
      router.push('/');  // Redirect to home
    } catch (error) {
      setError('Failed to place order');
    }
  };
  
  // 7. Render form
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Place Order</button>
    </form>
  );
}
```

**Key Concepts:**

**useEffect Hook:**
```tsx
useEffect(() => {
  // Runs after component renders
  // Good for: API calls, setting up subscriptions
}, [dependencies]);  // Re-run if dependencies change
```

**useState Hook:**
```tsx
const [formData, setFormData] = useState({});
// formData - current value
// setFormData - function to update value
```

**Event Handlers:**
```tsx
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};
```

**Async/Await:**
```tsx
const response = await ordersAPI.create(orderData);
// Waits for API call to complete
// Then continues to next line
```

---

## How Frontend and Backend Communicate

### HTTP Protocol

**HTTP (HyperText Transfer Protocol)** is how frontend and backend talk.

**Request Structure:**
```
POST /api/orders HTTP/1.1
Host: localhost:5000
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [{"product_id": 1, "quantity": 2}],
  "payment_method": "Cash"
}
```

**Response Structure:**
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "Order placed successfully",
  "order": {...}
}
```

### Complete Flow: Placing an Order

1. **User clicks "Place Order" button**
   ```tsx
   <button onClick={handleSubmit}>Place Order</button>
   ```

2. **Frontend prepares data**
   ```tsx
   const orderData = {
     items: items.map(item => ({
       product_id: item.id,
       quantity: item.quantity
     })),
     payment_method: 'Cash'
   };
   ```

3. **Frontend sends HTTP request**
   ```tsx
   const response = await ordersAPI.create(orderData);
   // Internally: axios.post('http://localhost:5000/api/orders', orderData)
   ```

4. **Request travels over network**
   - Frontend (port 3000) → Backend (port 5000)

5. **Backend receives request**
   ```python
   @orders_bp.route('/', methods=['POST'])
   @jwt_required()
   def create_order():
       data = request.get_json()  # Gets the orderData
   ```

6. **Backend processes request**
   - Validates data
   - Checks stock
   - Creates order in database
   - Calculates total
   - Awards reward points

7. **Backend sends response**
   ```python
   return jsonify({
       'message': 'Order placed successfully',
       'order': new_order.to_dict()
   }), 201
   ```

8. **Frontend receives response**
   ```tsx
   const response = await ordersAPI.create(orderData);
   // response = { message: '...', order: {...} }
   ```

9. **Frontend updates UI**
   ```tsx
   clearCart();
   alert('Order placed!');
   router.push('/');
   ```

### JSON (JavaScript Object Notation)

**What is JSON?**
A format for exchanging data. Both Python and JavaScript understand it.

**Python Dictionary:**
```python
{
    'name': 'John',
    'age': 30
}
```

**JSON (same thing):**
```json
{
    "name": "John",
    "age": 30
}
```

**JavaScript Object:**
```javascript
{
    name: 'John',
    age: 30
}
```

All three are essentially the same! That's why they work together.

---

## Project Structure Deep Dive

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py          # App initialization
│   ├── models.py            # Database models
│   └── routes/
│       ├── auth.py          # Authentication endpoints
│       ├── products.py      # Product endpoints
│       ├── orders.py        # Order endpoints
│       ├── reviews.py      # Review endpoints
│       ├── rewards.py       # Reward endpoints
│       └── admin.py        # Admin endpoints
├── run.py                   # Entry point
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```

**File Responsibilities:**

**`__init__.py`**: 
- Creates Flask app
- Configures database
- Registers blueprints
- Sets up CORS and JWT

**`models.py`**: 
- Defines all database tables
- Relationships between tables
- `to_dict()` methods for JSON conversion

**`routes/*.py`**: 
- Each file handles one domain (auth, orders, etc.)
- Contains endpoint functions
- Business logic

**`run.py`**: 
- Starts the server
- Entry point: `python run.py`

### Frontend Structure
```
frontend-nextjs/
├── app/
│   ├── layout.tsx           # Root layout (wraps all pages)
│   ├── page.tsx             # Homepage
│   ├── login/
│   │   └── page.tsx         # Login page
│   ├── menu/
│   │   └── page.tsx         # Menu page
│   ├── cart/
│   │   └── page.tsx         # Cart page
│   └── checkout/
│       └── page.tsx         # Checkout page
├── components/
│   ├── Navbar.tsx           # Navigation bar
│   └── Footer.tsx           # Footer
├── context/
│   ├── AuthContext.tsx      # Authentication state
│   └── CartContext.tsx      # Shopping cart state
├── lib/
│   └── api.ts               # API client
└── styles/
    └── globals.css          # Global styles
```

**File Responsibilities:**

**`app/layout.tsx`**: 
- Wraps entire application
- Provides contexts (Auth, Cart)
- Includes Navbar and Footer on all pages

**`app/*/page.tsx`**: 
- Each folder = one route
- Contains page component

**`components/`**: 
- Reusable UI components
- Used across multiple pages

**`context/`**: 
- Global state management
- Shared data (user, cart)

**`lib/api.ts`**: 
- All backend communication
- API functions organized by domain

---

## Step-by-Step Feature Walkthrough

### Feature 1: User Registration

**Backend Flow:**

1. **Route Definition** (`auth.py`):
   ```python
   @auth_bp.route('/register', methods=['POST'])
   def register():
   ```

2. **Receive Data**:
   ```python
   data = request.get_json()
   # data = {'name': 'John', 'email': 'john@example.com', 'password': '123'}
   ```

3. **Validate**:
   ```python
   if not data.get('email'):
       return jsonify({'error': 'Email required'}), 400
   ```

4. **Check Duplicates**:
   ```python
   if Customer.query.filter_by(email=data['email']).first():
       return jsonify({'error': 'Email exists'}), 400
   ```

5. **Hash Password**:
   ```python
   hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
   ```

6. **Create Customer**:
   ```python
   new_customer = Customer(
       name=data['name'],
       email=data['email'],
       password=hashed
   )
   db.session.add(new_customer)
   db.session.commit()
   ```

7. **Return Response**:
   ```python
   return jsonify({'message': 'Success', 'customer': new_customer.to_dict()}), 201
   ```

**Frontend Flow:**

1. **User Fills Form** (`signup/page.tsx`):
   ```tsx
   <input name="email" value={email} onChange={handleChange} />
   ```

2. **Form Submission**:
   ```tsx
   const handleSubmit = async (e) => {
     e.preventDefault();
     await authAPI.register({ name, email, password });
   };
   ```

3. **API Call** (`lib/api.ts`):
   ```tsx
   register: async (data) => {
     const response = await api.post('/auth/register', data);
     return response.data;
   }
   ```

4. **Update Context**:
   ```tsx
   await authContext.register({ name, email, password });
   // Automatically logs in after registration
   ```

### Feature 2: Adding to Cart

**Frontend Flow:**

1. **User Clicks "Add to Cart"** (`menu/page.tsx`):
   ```tsx
   <button onClick={() => addToCart(product)}>Add to Cart</button>
   ```

2. **Cart Context Function**:
   ```tsx
   const addToCart = (product) => {
     addItem({
       id: product.product_id,
       name: product.name,
       price: product.price,
       image: product.image_url
     });
   };
   ```

3. **Update State** (`CartContext.tsx`):
   ```tsx
   const addItem = (item) => {
     setItems(prevItems => {
       const existing = prevItems.find(i => i.name === item.name);
       if (existing) {
         // Update quantity
         return prevItems.map(i =>
           i.name === item.name 
             ? { ...i, quantity: i.quantity + 1 }
             : i
         );
       }
       // Add new item
       return [...prevItems, { ...item, quantity: 1 }];
     });
   };
   ```

4. **Persist to localStorage**:
   ```tsx
   useEffect(() => {
     localStorage.setItem('mochamagic_cart', JSON.stringify(items));
   }, [items]);
   ```

**No Backend Call!** Cart is stored locally until checkout.

### Feature 3: Placing an Order

**Complete Flow:**

1. **User on Checkout Page** (`checkout/page.tsx`)
   - Form pre-filled with user data
   - Cart items displayed

2. **User Clicks "Place Order"**:
   ```tsx
   const handleSubmit = async (e) => {
     e.preventDefault();
     
     // Prepare order data
     const orderData = {
       items: items.map(item => ({
         product_id: item.id,
         quantity: item.quantity,
         price: item.price
       })),
       payment_method: 'Cash',
       delivery_fee: 150
     };
     
     // Send to backend
     const response = await ordersAPI.create(orderData);
   };
   ```

3. **Backend Receives Request** (`orders.py`):
   ```python
   @orders_bp.route('/', methods=['POST'])
   @jwt_required()
   def create_order():
       customer_id = get_jwt_identity()  # From JWT token
       data = request.get_json()
   ```

4. **Backend Validates**:
   ```python
   # Check items exist
   for item in data['items']:
       product = Product.query.get(item['product_id'])
       if product.stock_quantity < item['quantity']:
           return jsonify({'error': 'Insufficient stock'}), 400
   ```

5. **Backend Creates Order**:
   ```python
   # Create order
   new_order = Orders(
       customer_id=customer_id,
       total_amount=total_amount,
       status='Pending'
   )
   db.session.add(new_order)
   
   # Create order details
   for item in order_items:
       order_detail = OrderDetails(
           order_id=new_order.order_id,
           product_id=item['product_id'],
           quantity=item['quantity']
       )
       db.session.add(order_detail)
       
       # Update stock
       product.stock_quantity -= item['quantity']
   ```

6. **Backend Awards Points**:
   ```python
   points_earned = int(total_amount / 100)
   customer.reward_points += points_earned
   ```

7. **Backend Commits**:
   ```python
   db.session.commit()  # Save everything
   ```

8. **Backend Returns Response**:
   ```python
   return jsonify({
       'message': 'Order placed',
       'order': new_order.to_dict(),
       'points_earned': points_earned
   }), 201
   ```

9. **Frontend Receives Response**:
   ```tsx
   const response = await ordersAPI.create(orderData);
   // response = { message: '...', order: {...}, points_earned: 5 }
   ```

10. **Frontend Updates UI**:
    ```tsx
    clearCart();  // Clear cart
    alert(`Order placed! Points earned: ${response.points_earned}`);
    router.push('/');  // Go to homepage
    ```

---

## Key Concepts Explained

### 1. State Management

**What is State?**
Data that can change and affects what the user sees.

**Local State** (Component-level):
```tsx
const [count, setCount] = useState(0);
// Only this component knows about count
```

**Global State** (Context):
```tsx
const { user } = useAuth();
// Any component can access user
```

**Why Context?**
- Share data across components
- Avoid prop drilling
- Single source of truth

### 2. Authentication & Authorization

**Authentication**: "Who are you?" (Login)
**Authorization**: "What can you do?" (Permissions)

**JWT Token Flow:**
1. User logs in → Backend creates JWT
2. Frontend stores token in localStorage
3. Every request includes token in header
4. Backend validates token → extracts user ID

**Why JWT?**
- Stateless (no server-side session storage)
- Contains user info (no database lookup needed)
- Secure (signed, can't be tampered with)

### 3. Database Relationships

**One-to-Many:**
- One Customer → Many Orders
```python
# In Customer model
orders = db.relationship('Orders', backref='customer')

# Usage
customer.orders  # List of all orders
order.customer   # The customer who placed order
```

**Many-to-Many:**
- Products ↔ Categories (if product can have multiple categories)

**Foreign Keys:**
```python
customer_id = db.Column(db.Integer, db.ForeignKey('Customer.customer_id'))
```
- Links Order to Customer
- Ensures data integrity

### 4. Async/Await

**Problem:**
API calls take time. We don't want to freeze the UI.

**Solution:**
```tsx
// Without async/await (old way)
api.post('/orders', data)
  .then(response => {
    console.log(response);
  })
  .catch(error => {
    console.error(error);
  });

// With async/await (modern way)
try {
  const response = await api.post('/orders', data);
  console.log(response);
} catch (error) {
  console.error(error);
}
```

**What `await` does:**
- Pauses function execution
- Waits for promise to resolve
- Continues with result

### 5. Error Handling

**Frontend:**
```tsx
try {
  const response = await ordersAPI.create(data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    setError(error.response.data.error);
  } else if (error.request) {
    // Request made but no response
    setError('Server not responding');
  } else {
    // Something else
    setError('Unexpected error');
  }
}
```

**Backend:**
```python
try:
    # Process order
    db.session.commit()
except Exception as e:
    db.session.rollback()  # Undo changes
    return jsonify({'error': str(e)}), 500
```

### 6. Environment Variables

**Why?**
- Keep secrets out of code
- Different configs for dev/production

**Backend (`.env`):**
```
DB_USER=root
DB_PASSWORD=secret
JWT_SECRET_KEY=my-secret-key
```

**Usage:**
```python
import os
db_user = os.getenv('DB_USER', 'root')  # Default: 'root'
```

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Usage:**
```tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

### 7. CORS (Cross-Origin Resource Sharing)

**Problem:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Browser blocks requests between different origins

**Solution:**
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"]
    }
})
```

Allows frontend to make requests to backend.

### 8. Database Migrations

**What are Migrations?**
Scripts that modify database schema (add tables, columns, etc.)

**Why?**
- Version control for database
- Apply changes consistently
- Rollback if needed

**Example:**
```bash
flask db migrate -m "Add reward_points to Customer"
flask db upgrade
```

---

## Practice Exercises

### Exercise 1: Add a New Field
**Task**: Add a `phone_number` field to the Customer model.

**Steps:**
1. Update `models.py`:
   ```python
   phone_number = db.Column(db.String(20))
   ```

2. Update registration endpoint to accept phone_number

3. Update frontend signup form to include phone field

4. Test registration with phone number

### Exercise 2: Create a New Endpoint
**Task**: Create an endpoint to get order statistics.

**Steps:**
1. In `orders.py`, add:
   ```python
   @orders_bp.route('/stats', methods=['GET'])
   @jwt_required()
   def get_order_stats():
       customer_id = get_jwt_identity()
       # Count orders, calculate total spent, etc.
   ```

2. Add function to `api.ts`:
   ```tsx
   getStats: async () => {
     const response = await api.get('/orders/stats');
     return response.data;
   }
   ```

3. Create a page to display stats

### Exercise 3: Add Validation
**Task**: Add email format validation.

**Backend:**
```python
import re
if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
    return jsonify({'error': 'Invalid email format'}), 400
```

**Frontend:**
```tsx
const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
if (!emailRegex.test(email)) {
  setError('Invalid email format');
  return;
}
```

### Exercise 4: Add Loading States
**Task**: Show loading spinner during API calls.

```tsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.post('/orders', data);
  } finally {
    setLoading(false);
  }
};

return (
  <button disabled={loading}>
    {loading ? 'Loading...' : 'Submit'}
  </button>
);
```

### Exercise 5: Error Boundaries
**Task**: Create error boundary component.

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

---

## Common Questions & Answers

### Q: Why separate frontend and backend?
**A**: 
- **Separation of concerns**: UI logic vs business logic
- **Scalability**: Can scale independently
- **Technology choice**: Use best tool for each part
- **Team collaboration**: Frontend and backend teams can work separately

### Q: What is the difference between GET and POST?
**A**:
- **GET**: Retrieve data (read-only). Data in URL: `/api/products?id=1`
- **POST**: Create new data. Data in body: `{ "name": "Coffee" }`
- **PUT**: Update existing data
- **DELETE**: Remove data

### Q: Why use TypeScript instead of JavaScript?
**A**:
- **Type safety**: Catches errors before runtime
- **Better IDE support**: Autocomplete, refactoring
- **Self-documenting**: Types show what data is expected
- **Easier debugging**: Type errors are clear

### Q: What is the difference between useState and useEffect?
**A**:
- **useState**: Manages component state (data that changes)
- **useEffect**: Runs side effects (API calls, subscriptions) after render

### Q: Why hash passwords?
**A**:
- **Security**: If database is hacked, passwords aren't exposed
- **One-way**: Can't reverse hash to get original password
- **Verification**: Can still check if password is correct

### Q: What is a JWT token?
**A**:
- **JSON Web Token**: Contains user info (ID, expiration)
- **Signed**: Backend can verify it wasn't tampered with
- **Stateless**: No need to store sessions in database
- **Format**: `header.payload.signature`

### Q: Why use Context instead of props?
**A**:
- **Avoid prop drilling**: Don't pass props through many components
- **Global state**: Data accessible anywhere
- **Cleaner code**: Less boilerplate

### Q: What is CORS?
**A**:
- **Cross-Origin Resource Sharing**: Security feature
- **Problem**: Browsers block requests to different origins
- **Solution**: Backend explicitly allows frontend origin

### Q: What is a database migration?
**A**:
- **Script**: Changes database schema
- **Version control**: Track database changes
- **Consistency**: Same changes applied to all environments

---

## Next Steps for Learning

1. **Read the Code**: Go through each file, understand what it does
2. **Add Features**: Try the practice exercises
3. **Debug**: Add console.logs, see data flow
4. **Modify**: Change existing features, see what breaks
5. **Build Something New**: Create a new feature from scratch

### Recommended Learning Path

1. **Week 1**: Understand project structure, read all files
2. **Week 2**: Trace one complete feature (e.g., registration → login → order)
3. **Week 3**: Modify existing features, add small changes
4. **Week 4**: Build a new feature independently

### Resources

- **Flask Documentation**: https://flask.palletsprojects.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **React Documentation**: https://react.dev/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **JWT**: https://jwt.io/introduction

---

## Summary

This project demonstrates:
- **Full-stack development**: Frontend + Backend
- **REST API**: Standard way to communicate
- **Database**: Storing and retrieving data
- **Authentication**: Secure user access
- **State Management**: Managing application data
- **Modern Web Development**: React, Next.js, TypeScript

**Key Takeaways:**
1. Frontend = User Interface (what users see)
2. Backend = Business Logic (how things work)
3. Database = Data Storage (where information lives)
4. API = Communication Bridge (how frontend talks to backend)
5. Authentication = Security (who can do what)

**Remember**: Start small, understand one piece at a time, and build from there!

---

*Good luck with your learning journey! ☕*


