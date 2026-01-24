-- Update subscription_templates logo URLs to use Google Favicon API (Clearbit is shutting down)
UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=netflix.com&sz=64'
WHERE name = 'Netflix';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=spotify.com&sz=64'
WHERE name = 'Spotify';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64'
WHERE name = 'YouTube Premium';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64'
WHERE name = 'Amazon Prime';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=apple.com&sz=64'
WHERE name = 'Apple Music';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=icloud.com&sz=64'
WHERE name = 'iCloud Storage';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=google.com&sz=64'
WHERE name = 'Google One';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64'
WHERE name = 'Microsoft 365';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64'
WHERE name = 'Adobe Creative Cloud';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=disneyplus.com&sz=64'
WHERE name = 'Disney+';

UPDATE subscription_templates
SET logo_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64'
WHERE name ILIKE '%chatgpt%' OR name ILIKE '%openai%';

-- Also update existing subscriptions with broken Clearbit URLs
UPDATE subscriptions
SET logo_url = 'https://www.google.com/s2/favicons?domain=' || 
  REPLACE(REPLACE(logo_url, 'https://logo.clearbit.com/', ''), '/', '') || '&sz=64'
WHERE logo_url LIKE 'https://logo.clearbit.com/%';