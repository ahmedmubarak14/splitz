#!/usr/bin/env node

/**
 * Asset Generation Script for Splitz App
 * Generates production-ready icons and splash screens
 *
 * This creates a professional gradient design with the app name
 * Run: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets');
const IMAGES_DIR = path.join(ASSETS_DIR, 'images');

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Generate SVG icon (1024x1024)
const iconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Rounded rectangle background -->
  <rect width="1024" height="1024" rx="180" fill="url(#bgGradient)"/>

  <!-- Split symbol - representing task/expense splitting -->
  <g transform="translate(512, 512)">
    <!-- Left half circle -->
    <path d="M -180 -180 A 180 180 0 0 1 -180 180 L -80 180 A 80 80 0 0 0 -80 -180 Z"
          fill="white" opacity="0.95"/>

    <!-- Right half circle -->
    <path d="M 180 -180 A 180 180 0 0 0 180 180 L 80 180 A 80 80 0 0 1 80 -180 Z"
          fill="white" opacity="0.95"/>

    <!-- Center divider with gradient -->
    <rect x="-15" y="-200" width="30" height="400" fill="url(#accentGradient)" rx="15"/>

    <!-- Top connector -->
    <circle cx="0" cy="-180" r="35" fill="url(#accentGradient)"/>

    <!-- Bottom connector -->
    <circle cx="0" cy="180" r="35" fill="url(#accentGradient)"/>
  </g>
</svg>`;

// Generate splash screen SVG (1242x2436 - iPhone 13 Pro Max)
const splashSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1242" height="2436" viewBox="0 0 1242 2436" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1242" height="2436" fill="url(#splashGradient)"/>

  <!-- Logo (same as icon but scaled) -->
  <g transform="translate(621, 1000)">
    <!-- Left half circle -->
    <path d="M -120 -120 A 120 120 0 0 1 -120 120 L -55 120 A 55 55 0 0 0 -55 -120 Z"
          fill="white" opacity="0.95"/>

    <!-- Right half circle -->
    <path d="M 120 -120 A 120 120 0 0 0 120 120 L 55 120 A 55 55 0 0 1 55 -120 Z"
          fill="white" opacity="0.95"/>

    <!-- Center divider -->
    <rect x="-10" y="-135" width="20" height="270" fill="white" rx="10"/>

    <!-- Top connector -->
    <circle cx="0" cy="-120" r="23" fill="white"/>

    <!-- Bottom connector -->
    <circle cx="0" cy="120" r="23" fill="white"/>
  </g>

  <!-- App name -->
  <text x="621" y="1280" font-family="Arial, sans-serif" font-size="80" font-weight="bold"
        fill="white" text-anchor="middle">Splitz</text>

  <!-- Tagline -->
  <text x="621" y="1350" font-family="Arial, sans-serif" font-size="36"
        fill="white" opacity="0.9" text-anchor="middle">Organize. Track. Achieve.</text>
</svg>`;

// Generate adaptive icon (Android)
const adaptiveIconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient (no rounded corners for adaptive icon) -->
  <defs>
    <linearGradient id="adaptiveBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="adaptiveAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Full background -->
  <rect width="1024" height="1024" fill="url(#adaptiveBgGradient)"/>

  <!-- Logo (slightly larger for safe zone) -->
  <g transform="translate(512, 512)">
    <!-- Left half circle -->
    <path d="M -200 -200 A 200 200 0 0 1 -200 200 L -90 200 A 90 90 0 0 0 -90 -200 Z"
          fill="white" opacity="0.95"/>

    <!-- Right half circle -->
    <path d="M 200 -200 A 200 200 0 0 0 200 200 L 90 200 A 90 90 0 0 1 90 -200 Z"
          fill="white" opacity="0.95"/>

    <!-- Center divider -->
    <rect x="-18" y="-220" width="36" height="440" fill="url(#adaptiveAccentGradient)" rx="18"/>

    <!-- Top connector -->
    <circle cx="0" cy="-200" r="40" fill="url(#adaptiveAccentGradient)"/>

    <!-- Bottom connector -->
    <circle cx="0" cy="200" r="40" fill="url(#adaptiveAccentGradient)"/>
  </g>
</svg>`;

// Write files
fs.writeFileSync(path.join(IMAGES_DIR, 'icon.svg'), iconSVG);
fs.writeFileSync(path.join(IMAGES_DIR, 'splash.svg'), splashSVG);
fs.writeFileSync(path.join(IMAGES_DIR, 'adaptive-icon.svg'), adaptiveIconSVG);

console.log('✅ SVG assets generated successfully!');
console.log('\nGenerated files:');
console.log('  - assets/images/icon.svg (App icon)');
console.log('  - assets/images/splash.svg (Splash screen)');
console.log('  - assets/images/adaptive-icon.svg (Android adaptive icon)');
console.log('\n📝 Next steps:');
console.log('  1. Convert SVGs to PNGs using: npm run assets:convert');
console.log('  2. Or use https://cloudconvert.com/svg-to-png for manual conversion');
console.log('  3. Update app.json to reference these assets');
console.log('\n💡 For production, consider:');
console.log('  - Customizing colors in this script');
console.log('  - Hiring a designer for unique branding');
console.log('  - Using tools like https://makeappicon.com/');
