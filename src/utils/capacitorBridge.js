// ============================================================================
// src/utils/capacitorBridge.js
// Unified Bridge for Web + Native Capacitor (Android & iOS) Apps
// Handles:
// 1. Native platform detection (Capacitor Android/iOS vs Web browser)
// 2. Dynamic API Base URL resolution for packaged native apps
// 3. Google AdMob (Native) vs Google AdSense (Web) seamless coordination
// 4. Native Push Notifications & Native Share fallbacks
// ============================================================================

export function isCapacitorNative() {
  if (typeof window === 'undefined') return false;
  if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function') {
    return Boolean(window.Capacitor.isNativePlatform());
  }
  const proto = window.location?.protocol || '';
  return proto === 'capacitor:' || proto === 'ionic:' || Boolean(window.Capacitor?.isNative);
}

export function getCapacitorPlatform() {
  if (typeof window === 'undefined') return 'web';
  if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function') {
    return window.Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
  }
  return isCapacitorNative() ? 'android' : 'web';
}

/**
 * Resolves the `/api` base URL so that:
 * - On Web (Vite dev, XAMPP, cPanel, custom domain): uses relative `/api` or subfolder `/api`
 * - Inside a Native Capacitor APK/IPA: uses the configured remote server URL
 *   (`VITE_API_BASE_URL` or `localStorage.getItem('shoplenca_capacitor_server_url')`)
 */
export function resolveApiBaseUrl(defaultWebApiUrl = '/api') {
  if (typeof window === 'undefined') return defaultWebApiUrl;

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  const storedServer = localStorage.getItem('shoplenca_capacitor_server_url');
  if (isCapacitorNative() && storedServer) {
    const clean = storedServer.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  return defaultWebApiUrl;
}

export function syncCapacitorServerUrl(serverUrl) {
  if (typeof window === 'undefined' || !serverUrl) return;
  const trimmed = String(serverUrl).trim();
  if (trimmed) {
    localStorage.setItem('shoplenca_capacitor_server_url', trimmed);
  }
}

/**
 * Initializes Native AdMob Banner if running inside a Capacitor native shell
 * with `@capacitor-community/admob` installed.
 */
export async function showCapacitorAdMobBanner(admobConfig = {}) {
  if (!isCapacitorNative()) return false;
  try {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) return false;

    await AdMob.initialize({
      requestTrackingAuthorization: true,
      initializeForTesting: false,
    });

    const adId = admobConfig.bannerId || 'ca-app-pub-3940256099942544/6300978111';
    await AdMob.showBanner({
      adId,
      adSize: 'ADAPTIVE_BANNER',
      position: 'BOTTOM_CENTER',
      margin: 0,
      isTesting: adId.includes('3940256099942544'),
    });
    return true;
  } catch (err) {
    console.warn('Capacitor AdMob bridge notice:', err);
    return false;
  }
}

/**
 * Triggers a Native AdMob Interstitial Ad (if running in Capacitor with AdMob plugin)
 */
export async function triggerCapacitorInterstitial(admobConfig = {}) {
  if (!isCapacitorNative()) return false;
  try {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) return false;
    const adId = admobConfig.interstitialId || 'ca-app-pub-3940256099942544/1033173712';
    await AdMob.prepareInterstitial({
      adId,
      isTesting: adId.includes('3940256099942544'),
    });
    await AdMob.showInterstitial();
    return true;
  } catch {
    return false;
  }
}

/**
 * Registers Native Push Notifications when inside a Capacitor shell
 */
export async function registerCapacitorPush(onTokenReceived) {
  if (!isCapacitorNative()) return false;
  try {
    const PushNotifications = window.Capacitor?.Plugins?.PushNotifications;
    if (!PushNotifications) return false;

    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
      PushNotifications.addListener('registration', (token) => {
        if (onTokenReceived) onTokenReceived(token.value);
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

