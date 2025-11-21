# Splitz App Assets

This directory contains all visual assets for the Splitz mobile application.

## Generated Assets

Professional SVG assets have been generated in `assets/images/`:

- **icon.svg** - Main app icon (1024x1024)
- **splash.svg** - Splash screen (1242x2436)
- **adaptive-icon.svg** - Android adaptive icon (1024x1024)

## Converting to PNG

### Option 1: Using Online Tools (Easiest)
1. Go to https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Set dimensions:
   - icon.svg → 1024x1024
   - splash.svg → 1242x2436
   - adaptive-icon.svg → 1024x1024
4. Download and rename:
   - icon.svg → icon.png
   - splash.svg → splash.png
   - adaptive-icon.svg → adaptive-icon.png
5. Place in `/assets` directory

### Option 2: Using ImageMagick (Command Line)
```bash
cd packages/mobile/assets

# Convert icon
convert images/icon.svg -resize 1024x1024 icon.png

# Convert splash
convert images/splash.svg -resize 1242x2436 splash.png

# Convert adaptive icon
convert images/adaptive-icon.svg -resize 1024x1024 adaptive-icon.png
```

### Option 3: Using Sharp (Node.js)
```bash
npm install -g sharp-cli
sharp -i images/icon.svg -o icon.png --width 1024 --height 1024
sharp -i images/splash.svg -o splash.png --width 1242 --height 2436
sharp -i images/adaptive-icon.svg -o adaptive-icon.png --width 1024 --height 1024
```

## Additional Required Assets

### Notification Icon (Android)
- **File**: `notification-icon.png`
- **Size**: 96x96 pixels
- **Format**: PNG with transparency
- **Style**: Flat, monochrome white icon on transparent background
- **Note**: Create simplified version of main icon

### Favicon (Web/PWA)
- **File**: `favicon.png`
- **Size**: 32x32 pixels
- **Format**: PNG or ICO
- **Source**: Resize icon.png

## App Store Screenshots

For app store submission, you'll need screenshots of the app running:

### iOS Screenshots Needed:
- **iPhone 6.7"** (iPhone 14 Pro Max): 1290 x 2796 pixels
- **iPhone 6.5"** (iPhone 11 Pro Max): 1242 x 2688 pixels
- **iPhone 5.5"** (iPhone 8 Plus): 1242 x 2208 pixels
- **iPad Pro 12.9"**: 2048 x 2732 pixels

### Android Screenshots Needed:
- **Phone**: 1080 x 1920 pixels (minimum)
- **7" Tablet**: 1200 x 1920 pixels
- **10" Tablet**: 1800 x 2560 pixels

**Quantity**: 5-8 screenshots per device type showing key features

## Customization

To customize the app's visual identity:

1. **Edit Colors**: Modify `scripts/generate-assets.js`
   ```javascript
   // Change gradient colors in the script
   <stop offset="0%" style="stop-color:#YOUR_COLOR;stop-opacity:1" />
   ```

2. **Regenerate**: Run `node scripts/generate-assets.js`

3. **Convert**: Follow conversion steps above

## Design Guidelines

### iOS
- Use rounded corners (180px radius for 1024x1024)
- No transparency in icon background
- Avoid text in icons
- Follow Apple's Human Interface Guidelines

### Android
- Adaptive icon has separate foreground and background layers
- Keep important content within safe zone (center 66%)
- Can use transparency
- Follow Material Design guidelines

## Professional Design Services

If you want custom branded assets:
- **Fiverr**: $25-150 for icon + splash screen
- **99designs**: $299+ for full app branding
- **Upwork**: $50-200 per hour for freelance designers
- **MakeAppIcon.com**: $5 automated icon generation

## Asset Checklist

Before submission, ensure you have:
- [ ] icon.png (1024x1024)
- [ ] splash.png (1242x2436)
- [ ] adaptive-icon.png (1024x1024)
- [ ] notification-icon.png (96x96)
- [ ] favicon.png (32x32)
- [ ] 5-8 iPhone screenshots
- [ ] 5-8 Android screenshots
- [ ] App Store feature graphic (1024x500) for Google Play

## Testing Assets

Preview your assets:
```bash
# Start Expo
npm start

# Scan QR code with Expo Go app
# Check icon, splash screen, and overall appearance
```

## Notes

- Current generated assets use a modern gradient design with a "split" symbol
- Colors match the app's indigo/purple theme
- Professional enough for initial launch
- Can be replaced with custom designs later
- SVG sources preserved for easy editing
