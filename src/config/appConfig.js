// ============================================================================
// src/config/appConfig.js
// Central configuration for Web & Mobile App builds (Capacitor / React Native)
// Automatically works on Vite dev server (localhost:5173), root domain, or XAMPP subfolders
// ============================================================================

import { resolveApiBaseUrl, isCapacitorNative, getCapacitorPlatform } from '../utils/capacitorBridge';

function detectBasePath() {
  if (typeof window === 'undefined' || isCapacitorNative()) return '';
  const path = window.location.pathname || '';
  if (path.startsWith('/air9tv/shopping')) return '/air9tv/shopping';
  if (path.startsWith('/shopping')) return '/shopping';
  return '';
}

const detectedBase = detectBasePath();

export const APP_CONFIG = {
  IS_NATIVE_APP: isCapacitorNative(),
  PLATFORM: getCapacitorPlatform(),
  BASE_PATH: detectedBase,
  API_BASE_URL: resolveApiBaseUrl(`${detectedBase}/api`),
  DEFAULT_COMPANY: {
    name: 'Shoplenca',
    title: 'Shoplenca - Buy, sell, and launch your own custom domain store',
    desc: 'Create your own subdomain store or attach a custom domain. Buy, sell, and grow your e-commerce business effortlessly with Shoplenca.',
    keywords: 'e-commerce, buy and sell, online store, custom domain, subdomain, shoplenca',
    logo: '/logo.png',
    shipping_fee: 99,
    free_ship_min: 999,
    prepaid_discount: 10,
    announcement_text: 'Free shipping above $99 · Extra 10% off on prepaid orders · 7-day easy returns',
  },
  STATES: [
    'Abia', 'Abuja (FCT)', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Delta', 'Edo', 'Enugu', 'Imo', 'Kaduna', 'Kano', 'Kwara', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Rivers',
    'Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
    'California', 'Florida', 'Illinois', 'New York', 'Texas', 'Washington', 'London', 'Ontario'
  ],
};
