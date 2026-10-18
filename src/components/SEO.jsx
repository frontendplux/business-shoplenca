import { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

/**
 * Dynamic SEO & Structured Data (JSON-LD) manager for every route.
 * Ensures search engines and social shares receive rich metadata.
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  type = 'website',
  jsonLd = null,
}) {
  const { company } = useStore();

  useEffect(() => {
    const siteTitle = company?.title || company?.name || 'Shoplenca';
    const fullTitle = title ? `${title} | ${company?.name || 'Shoplenca'}` : siteTitle;
    const desc = description || company?.desc || '';
    const kw = keywords || company?.keywords || '';
    const ogImg = image || company?.logo || '/logo.png';
    const url = window.location.href;

    document.title = fullTitle;

    const setMeta = (selector, attrName, attrValue, content) => {
      if (!content) return;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', desc);
    setMeta('meta[name="keywords"]', 'name', 'keywords', kw);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:image"]', 'property', 'og:image', ogImg);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);

    // Canonical link
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // JSON-LD Structured Data
    const scriptId = 'seo-json-ld';
    let ldScript = document.getElementById(scriptId);
    if (jsonLd) {
      if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.id = scriptId;
        ldScript.type = 'application/ld+json';
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    } else if (ldScript) {
      ldScript.remove();
    }
  }, [title, description, keywords, image, type, jsonLd, company]);

  return null;
}

