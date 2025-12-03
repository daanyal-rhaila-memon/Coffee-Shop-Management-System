'use client';

import { useState, useEffect } from 'react';
import { reviewsAPI, productsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Review {
  review_id: number;
  customer_name: string;
  product_name?: string;
  product_id?: number;
  rating: number;
  comment: string;
  review_date: string;
}

interface Product {
  product_id: number;
  name: string;
  category_id?: number;
}

interface Category {
  category_id: number;
  category_name: string;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formProducts, setFormProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    product_id: 0,
    rating: 5,
    comment: '',
  });

  const loadCategories = async () => {
    try {
      const categoriesList = await productsAPI.getCategories();
      const categoriesArray = Array.isArray(categoriesList) ? categoriesList : [];
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadProducts = async (categoryId?: number | null) => {
    try {
      const params = categoryId ? { category_id: categoryId } : undefined;
      const response = await productsAPI.getAll(params);
      const productsList = response.products || [];
      setFormProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
      setFormProducts([]);
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      if (!user) {
        setReviews([]);
        return;
      }
      const customerReviews = await reviewsAPI.getCustomerReviews();
      setReviews(Array.isArray(customerReviews) ? customerReviews : []);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadReviews();
    }
    loadCategories();
    loadProducts(null); // Load all products initially
  }, [user]);

  // Update form products when form category changes
  useEffect(() => {
    loadProducts(formCategoryId);
    setFormData((prev) => ({ ...prev, product_id: 0 })); // Reset product selection
  }, [formCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to submit a review');
      return;
    }

    if (!formData.product_id || formData.product_id === 0) {
      alert('Please select a product');
      return;
    }

    try {
      const reviewData = {
        product_id: formData.product_id,
        rating: formData.rating,
        comment: formData.comment || '',
      };
      await reviewsAPI.create(reviewData);
      alert('Review submitted successfully!');
      // Reset form
      setFormData({ product_id: 0, rating: 5, comment: '' });
      setFormCategoryId(null);
      setShowForm(false);
      // Reload reviews to show the new one
      loadReviews();
    } catch (error: any) {
      console.error('Review submission error:', error);
      alert(error.response?.data?.error || 'Failed to submit review');
    }
  };

  return (
    <>
      <header>
        <h1>My Reviews</h1>
        <p>View and manage your product reviews</p>
      </header>

      <section className="content">
        <div className="review-box">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {reviews.length === 0 ? (
                <div className="text-center py-5">
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.review_id} className="mb-4">
                    <h3>
                      {'⭐'.repeat(review.rating)} {review.product_name || 'Product'}
                    </h3>
                    <p>&quot;{review.comment || 'No comment provided'}&quot;</p>
                    <small className="text-muted">
                      {new Date(review.review_date).toLocaleDateString()}
                    </small>
                    <hr />
                  </div>
                ))
              )}

              {user && (
                <div className="mt-4">
                  {!showForm ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setShowForm(true);
                        // Reset form when opening
                        setFormData({ product_id: 0, rating: 5, comment: '' });
                        setFormCategoryId(null);
                        loadProducts(null); // Load all products initially
                      }}
                    >
                      Write a Review
                    </button>
                  ) : (
                  <form onSubmit={handleSubmit} className="mt-3">
                    <div className="mb-3" style={{ position: 'relative', zIndex: 10 }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                        Category
                      </label>
                      <select
                        className="form-control"
                        value={formCategoryId === null ? '' : String(formCategoryId)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setFormCategoryId(null);
                            setFormData((prev) => ({ ...prev, product_id: 0 }));
                          } else {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              setFormCategoryId(numValue);
                              setFormData((prev) => ({ ...prev, product_id: 0 }));
                            }
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                      >
                        <option value="">All Categories</option>
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <option key={category.category_id} value={String(category.category_id)}>
                              {category.category_name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>Loading categories...</option>
                        )}
                      </select>
                    </div>
                    <div className="mb-3" style={{ position: 'relative', zIndex: 10 }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                        Product
                      </label>
                      <select
                        className="form-control"
                        value={String(formData.product_id)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value)) {
                            setFormData({
                              ...formData,
                              product_id: value,
                            });
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        required
                        style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                        disabled={formCategoryId !== null && formProducts.length === 0}
                      >
                        <option value="0">Select a product</option>
                        {formProducts.length > 0 ? (
                          formProducts.map((product) => (
                            <option key={product.product_id} value={String(product.product_id)}>
                              {product.name}
                            </option>
                          ))
                        ) : (
                          <option value="0" disabled>
                            {formCategoryId ? 'No products in this category' : 'Loading products...'}
                          </option>
                        )}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Rating</label>
                      <select
                        className="form-control"
                        value={formData.rating}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rating: parseInt(e.target.value),
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        required
                        style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                      >
                        <option value={5}>5 ⭐</option>
                        <option value={4}>4 ⭐</option>
                        <option value={3}>3 ⭐</option>
                        <option value={2}>2 ⭐</option>
                        <option value={1}>1 ⭐</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Comment</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary me-2">
                      Submit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </form>
                )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

