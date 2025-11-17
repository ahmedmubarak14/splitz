import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  canonicalUrl?: string;
}

export const SEO = ({ 
  title, 
  description, 
  keywords, 
  image,
  canonicalUrl 
}: SEOProps) => {
  const location = useLocation();
  
  const defaultTitle = 'Splitz - Track Habits, Split Expenses, Challenge Friends';
  const defaultDescription = 'Build better habits, join friend challenges, and split expenses effortlessly. Stay organized and motivated with push notifications.';
  const defaultKeywords = 'habit tracker, expense splitter, challenge app, productivity, finance management';
  const defaultImage = '/splitz-logo.png';
  
  const pageTitle = title ? `${title} | Splitz` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords || defaultKeywords;
  const pageImage = image || defaultImage;
  const pageUrl = canonicalUrl || `https://splitz.app${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = pageTitle;
    
    // Update meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };
    
    // Standard meta tags
    updateMetaTag('description', pageDescription);
    updateMetaTag('keywords', pageKeywords);
    
    // Open Graph tags
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', pageDescription, true);
    updateMetaTag('og:image', pageImage, true);
    updateMetaTag('og:url', pageUrl, true);
    updateMetaTag('og:type', 'website', true);
    
    // Twitter tags
    updateMetaTag('twitter:title', pageTitle);
    updateMetaTag('twitter:description', pageDescription);
    updateMetaTag('twitter:image', pageImage);
    updateMetaTag('twitter:card', 'summary_large_image');
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);
  }, [pageTitle, pageDescription, pageKeywords, pageImage, pageUrl]);

  return null;
};

// Page-specific SEO configurations
export const pageSEO = {
  dashboard: {
    title: 'Dashboard',
    description: 'View your habits, challenges, expenses, and focus sessions all in one place',
    keywords: 'dashboard, overview, productivity hub, habit summary',
  },
  habits: {
    title: 'Habits',
    description: 'Track your daily habits and build lasting routines with streak tracking',
    keywords: 'habit tracker, daily habits, streak counter, routine builder',
  },
  challenges: {
    title: 'Challenges',
    description: 'Join or create challenges with friends and compete to reach your goals',
    keywords: 'group challenges, friend competition, goal setting, motivation',
  },
  expenses: {
    title: 'Expenses',
    description: 'Split bills and expenses with friends, track who owes what',
    keywords: 'expense splitter, bill splitting, group expenses, money tracking',
  },
  focus: {
    title: 'Focus',
    description: 'Stay focused with Pomodoro timer and grow virtual trees while you work',
    keywords: 'pomodoro timer, focus timer, productivity tool, time management',
  },
  profile: {
    title: 'Profile',
    description: 'Manage your account settings, preferences, and notifications',
    keywords: 'user profile, account settings, preferences, notifications',
  },
} as const;
