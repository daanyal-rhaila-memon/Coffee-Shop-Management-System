// cart.js - Add this file to your project

// Cart management functions
const Cart = {
  // Get cart items from localStorage
  getItems() {
    const cart = localStorage.getItem('mochamagic_cart');
    return cart ? JSON.parse(cart) : [];
  },

  // Save cart items to localStorage
  saveItems(items) {
    localStorage.setItem('mochamagic_cart', JSON.stringify(items));
  },

  // Add item to cart
  addItem(item) {
    const items = this.getItems();
    const existingItem = items.find(i => i.name === item.name);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      items.push({ ...item, quantity: 1 });
    }
    
    this.saveItems(items);
    this.updateCartCount();
    return true;
  },

  // Remove item from cart
  removeItem(itemName) {
    let items = this.getItems();
    items = items.filter(item => item.name !== itemName);
    this.saveItems(items);
    this.updateCartCount();
  },

  // Update item quantity
  updateQuantity(itemName, quantity) {
    const items = this.getItems();
    const item = items.find(i => i.name === itemName);
    
    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemName);
      } else {
        item.quantity = quantity;
        this.saveItems(items);
      }
    }
    this.updateCartCount();
  },

  // Get total items count
  getTotalCount() {
    const items = this.getItems();
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  // Get total price
  getTotalPrice() {
    const items = this.getItems();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  // Update cart count badge in navbar (optional)
  updateCartCount() {
    const count = this.getTotalCount();
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    });
  },

  // Clear cart
  clear() {
    localStorage.removeItem('mochamagic_cart');
    this.updateCartCount();
  }
};

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateCartCount();
});