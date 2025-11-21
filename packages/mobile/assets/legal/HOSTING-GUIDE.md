# Legal Documents Hosting Guide

You've got production-ready HTML versions of your Privacy Policy and Terms of Service! Now you need to host them online so you can provide URLs during app store submission.

## Quick Options for Hosting

### Option 1: GitHub Pages (FREE - Easiest)

**Time: 5 minutes**

1. **Create a new GitHub repository** (or use existing)
   ```bash
   # In your repo root
   git checkout -b gh-pages
   mkdir docs
   cp packages/mobile/assets/legal/*.html docs/
   git add docs
   git commit -m "Add legal documents"
   git push origin gh-pages
   ```

2. **Enable GitHub Pages**
   - Go to repo Settings → Pages
   - Source: gh-pages branch, /docs folder
   - Save

3. **Your URLs will be:**
   - Privacy: `https://yourusername.github.io/splitz/privacy-policy.html`
   - Terms: `https://yourusername.github.io/splitz/terms-of-service.html`

4. **Update app.json** with these URLs

---

### Option 2: Netlify (FREE - Very Easy)

**Time: 3 minutes**

1. Go to https://netlify.com and sign up
2. Drag and drop the `assets/legal` folder
3. Get instant URLs like:
   - `https://splitz-legal.netlify.app/privacy-policy.html`
   - `https://splitz-legal.netlify.app/terms-of-service.html`
4. Optional: Add custom domain

---

### Option 3: Vercel (FREE - Developer Friendly)

**Time: 5 minutes**

1. Sign up at https://vercel.com
2. Install Vercel CLI: `npm install -g vercel`
3. Deploy:
   ```bash
   cd packages/mobile/assets/legal
   vercel
   ```
4. Get URLs like: `https://splitz-legal.vercel.app/privacy-policy.html`

---

### Option 4: Your Own Domain

**Time: 30 minutes | Cost: $10-15/year**

If you already have a domain (e.g., `splitz.app`):

1. Create a simple web server or use any of the above options
2. Point subdomain: `legal.splitz.app` or `app.splitz.app`
3. Upload files to hosting
4. URLs become:
   - `https://splitz.app/privacy-policy`
   - `https://splitz.app/terms-of-service`

---

### Option 5: Firebase Hosting (FREE - Google Integrated)

**Time: 10 minutes**

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Copy HTML files to public folder
firebase deploy
```

URLs: `https://your-project.web.app/privacy-policy.html`

---

## Before Hosting Checklist

Update these placeholders in both HTML files:

### Privacy Policy
- [ ] Replace `privacy@splitz.app` with your actual email
- [ ] Replace `https://splitz.app` with your actual website
- [ ] Update "Last Updated" date to your launch date

### Terms of Service
- [ ] Replace `legal@splitz.app` with your actual email
- [ ] Replace `https://splitz.app` with your actual website
- [ ] Add `[Your Business Address]`
- [ ] Add `[Your Country/State]` for governing law
- [ ] Add `[Your Jurisdiction]` for disputes
- [ ] Update "Effective Date" to your launch date

---

## After Hosting

### 1. Test the URLs
- Open in browser
- Check mobile responsiveness
- Verify all links work
- Ensure proper rendering

### 2. Add to App.json
Update `packages/mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "privacyPolicyUrl": "https://your-url.com/privacy-policy.html",
      "termsOfServiceUrl": "https://your-url.com/terms-of-service.html"
    }
  }
}
```

### 3. Add to App Store Submissions
When submitting:
- **App Store Connect**: Add URLs in "Privacy Policy URL" field
- **Google Play Console**: Add URLs in "Privacy Policy" section

### 4. Link from App (Optional but Recommended)
Add links in your Settings screen:
```tsx
<TouchableOpacity onPress={() => Linking.openURL('https://your-url/privacy-policy.html')}>
  <Text>Privacy Policy</Text>
</TouchableOpacity>
```

---

## Need to Update Later?

Simply edit the HTML files and re-upload/deploy. The URLs stay the same!

---

## Recommended: Option 1 (GitHub Pages)

**Why?**
- ✅ Free forever
- ✅ Version controlled
- ✅ Easy to update (just git push)
- ✅ Professional URLs
- ✅ No account limitations
- ✅ Can add custom domain later

**Go with GitHub Pages unless you already have a website/domain setup!**
