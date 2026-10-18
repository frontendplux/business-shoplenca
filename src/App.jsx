import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { APP_CONFIG } from './config/appConfig';
import { StoreProvider } from './context/StoreContext';
import Layout from './components/Layout/Layout';

import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import MemberPage from './pages/MemberPage';
import AdminPage from './pages/AdminPage';
import BlogPage from './pages/BlogPage';
import BooksPage from './pages/BooksPage';
import ContactPage from './pages/ContactPage';
import StaticPage from './pages/StaticPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter basename={APP_CONFIG.BASE_PATH || '/'}>
      <StoreProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/search" element={<CategoryPage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage defaultTab="signin" />} />
            <Route path="/register" element={<LoginPage defaultTab="signup" />} />
            <Route path="/members" element={<MemberPage />} />
            <Route path="/member" element={<MemberPage />} />
            <Route path="/dashboard" element={<MemberPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/book" element={<BooksPage />} />
            <Route path="/readbooks" element={<BooksPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<StaticPage pageGroup="about" />} />
            <Route path="/privacy-policy" element={<StaticPage pageGroup="privacy" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  );
}
