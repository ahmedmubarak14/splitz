#!/usr/bin/env node

/**
 * Pre-Build Check Script
 * Runs automated checks before building for production
 * Ensures the app is ready for app store submission
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'app.json',
  'eas.json',
  '.env',
  'assets/icon.png',
  'assets/splash.png',
  'assets/adaptive-icon.png',
];

const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];

class PreBuildChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    console.log(`${icons[type]} ${message}`);
  }

  logSection(title) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'='.repeat(60)}\n`);
  }

  checkFileExists(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      this.log(`Found: ${filePath}`, 'success');
      this.passed++;
      return true;
    } else {
      this.log(`Missing: ${filePath}`, 'error');
      this.errors.push(`Missing required file: ${filePath}`);
      this.failed++;
      return false;
    }
  }

  checkAppJson() {
    this.logSection('Checking app.json Configuration');

    const appJsonPath = path.join(__dirname, '..', 'app.json');
    if (!this.checkFileExists('app.json')) {
      return;
    }

    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      const expo = appJson.expo;

      // Check required fields
      const requiredFields = {
        name: expo.name,
        slug: expo.slug,
        version: expo.version,
        icon: expo.icon,
        'splash.image': expo.splash?.image,
        'ios.bundleIdentifier': expo.ios?.bundleIdentifier,
        'android.package': expo.android?.package,
      };

      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
          this.log(`Missing ${field} in app.json`, 'error');
          this.errors.push(`Missing ${field} in app.json`);
          this.failed++;
        } else {
          this.log(`${field}: ${value}`, 'success');
          this.passed++;
        }
      }

      // Check iOS build number
      if (!expo.ios?.buildNumber) {
        this.log('Missing iOS buildNumber', 'warning');
        this.warnings.push('iOS buildNumber not set');
      }

      // Check Android version code
      if (!expo.android?.versionCode) {
        this.log('Missing Android versionCode', 'warning');
        this.warnings.push('Android versionCode not set');
      }

      // Check EAS project ID
      if (!expo.extra?.eas?.projectId) {
        this.log('Missing EAS projectId', 'error');
        this.errors.push('EAS projectId not configured');
        this.failed++;
      } else {
        this.log(`EAS projectId: ${expo.extra.eas.projectId}`, 'success');
        this.passed++;
      }
    } catch (error) {
      this.log(`Error reading app.json: ${error.message}`, 'error');
      this.errors.push(`Invalid app.json: ${error.message}`);
      this.failed++;
    }
  }

  checkEasJson() {
    this.logSection('Checking eas.json Configuration');

    const easJsonPath = path.join(__dirname, '..', 'eas.json');
    if (!this.checkFileExists('eas.json')) {
      return;
    }

    try {
      const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

      if (!easJson.build) {
        this.log('No build configuration found', 'error');
        this.errors.push('eas.json missing build configuration');
        this.failed++;
        return;
      }

      // Check for production profile
      if (!easJson.build.production) {
        this.log('No production build profile', 'error');
        this.errors.push('Missing production build profile in eas.json');
        this.failed++;
      } else {
        this.log('Production build profile found', 'success');
        this.passed++;
      }
    } catch (error) {
      this.log(`Error reading eas.json: ${error.message}`, 'error');
      this.errors.push(`Invalid eas.json: ${error.message}`);
      this.failed++;
    }
  }

  checkEnvFile() {
    this.logSection('Checking Environment Variables');

    const envPath = path.join(__dirname, '..', '.env');
    if (!this.checkFileExists('.env')) {
      this.log('Create .env from .env.example', 'warning');
      this.warnings.push('No .env file found');
      return;
    }

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');

      for (const varName of REQUIRED_ENV_VARS) {
        if (envContent.includes(varName)) {
          // Check if it has a value
          const match = envContent.match(new RegExp(`${varName}=(.+)`));
          if (match && match[1] && match[1].trim() !== '') {
            this.log(`${varName} is set`, 'success');
            this.passed++;
          } else {
            this.log(`${varName} is empty`, 'error');
            this.errors.push(`${varName} needs a value`);
            this.failed++;
          }
        } else {
          this.log(`${varName} not found`, 'error');
          this.errors.push(`Missing ${varName}`);
          this.failed++;
        }
      }
    } catch (error) {
      this.log(`Error reading .env: ${error.message}`, 'error');
      this.errors.push(`Could not read .env: ${error.message}`);
      this.failed++;
    }
  }

  checkAssets() {
    this.logSection('Checking Assets');

    const assetFiles = [
      'assets/icon.png',
      'assets/splash.png',
      'assets/adaptive-icon.png',
    ];

    for (const asset of assetFiles) {
      this.checkFileExists(asset);
    }

    // Check for SVG sources
    const svgFiles = [
      'assets/images/icon.svg',
      'assets/images/splash.svg',
      'assets/images/adaptive-icon.svg',
    ];

    this.log('\nChecking SVG sources (optional):', 'info');
    for (const svg of svgFiles) {
      const fullPath = path.join(__dirname, '..', svg);
      if (fs.existsSync(fullPath)) {
        this.log(`Found: ${svg}`, 'success');
      } else {
        this.log(`Not found: ${svg} (convert to PNG)`, 'warning');
      }
    }
  }

  checkLegalDocuments() {
    this.logSection('Checking Legal Documents');

    const legalFiles = [
      'assets/legal/privacy-policy.html',
      'assets/legal/terms-of-service.html',
    ];

    for (const file of legalFiles) {
      const exists = this.checkFileExists(file);
      if (exists) {
        this.log(`Remember to host ${file} online`, 'warning');
      }
    }
  }

  checkDependencies() {
    this.logSection('Checking Dependencies');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Check for required dependencies
      const requiredDeps = [
        'expo',
        'react-native',
        '@supabase/supabase-js',
        'expo-notifications',
        'expo-secure-store',
      ];

      for (const dep of requiredDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.log(`${dep} installed`, 'success');
          this.passed++;
        } else {
          this.log(`${dep} not found`, 'error');
          this.errors.push(`Missing dependency: ${dep}`);
          this.failed++;
        }
      }
    } catch (error) {
      this.log(`Error checking dependencies: ${error.message}`, 'error');
      this.failed++;
    }
  }

  printSummary() {
    this.logSection('Pre-Build Check Summary');

    console.log(`Total Checks: ${this.passed + this.failed}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}\n`);

    if (this.errors.length > 0) {
      console.log('ERRORS THAT MUST BE FIXED:');
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log('WARNINGS (RECOMMENDED TO FIX):');
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
      console.log();
    }

    if (this.errors.length === 0) {
      console.log('✅ All critical checks passed! Ready to build.\n');
      console.log('Next steps:');
      console.log('  1. Review warnings above');
      console.log('  2. Run: npm run build');
      console.log('  3. Test the build thoroughly');
      console.log('  4. Submit to app stores\n');
      return true;
    } else {
      console.log('❌ Build NOT ready. Fix errors above first.\n');
      return false;
    }
  }

  run() {
    console.log('\n🚀 Running Pre-Build Checks...\n');

    this.checkAppJson();
    this.checkEasJson();
    this.checkEnvFile();
    this.checkAssets();
    this.checkLegalDocuments();
    this.checkDependencies();

    const success = this.printSummary();

    process.exit(success ? 0 : 1);
  }
}

// Run the checker
const checker = new PreBuildChecker();
checker.run();
