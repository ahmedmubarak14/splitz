-- Add 20 popular subscription services to templates table
INSERT INTO subscription_templates (name, category, logo_url, typical_price, typical_currency, popularity_score, billing_cycles, cancellation_url)
VALUES
  -- Streaming & Entertainment
  ('HBO Max', 'entertainment', 'https://logo.clearbit.com/hbomax.com', 29.99, 'SAR', 88, ARRAY['monthly', 'yearly'], 'https://play.hbomax.com'),
  ('Hulu', 'entertainment', 'https://logo.clearbit.com/hulu.com', 25.99, 'SAR', 82, ARRAY['monthly'], 'https://secure.hulu.com/account'),
  ('Paramount+', 'entertainment', 'https://logo.clearbit.com/paramountplus.com', 19.99, 'SAR', 75, ARRAY['monthly', 'yearly'], 'https://www.paramountplus.com/account'),
  ('Apple TV+', 'entertainment', 'https://logo.clearbit.com/apple.com', 24.99, 'SAR', 85, ARRAY['monthly', 'yearly'], 'https://tv.apple.com/settings'),
  ('Shahid VIP', 'entertainment', 'https://logo.clearbit.com/shahid.net', 29.99, 'SAR', 92, ARRAY['monthly', 'yearly'], 'https://shahid.mbc.net/en/settings'),
  ('OSN+', 'entertainment', 'https://logo.clearbit.com/osn.com', 39.99, 'SAR', 80, ARRAY['monthly'], 'https://www.osnplus.com/account'),
  ('Twitch', 'entertainment', 'https://logo.clearbit.com/twitch.tv', 19.99, 'SAR', 78, ARRAY['monthly'], 'https://www.twitch.tv/subscriptions'),
  ('Audible', 'entertainment', 'https://logo.clearbit.com/audible.com', 44.99, 'SAR', 79, ARRAY['monthly'], 'https://www.audible.com/account'),
  
  -- Productivity & Software
  ('Dropbox', 'productivity', 'https://logo.clearbit.com/dropbox.com', 39.99, 'SAR', 84, ARRAY['monthly', 'yearly'], 'https://www.dropbox.com/account'),
  ('Notion', 'productivity', 'https://logo.clearbit.com/notion.so', 29.99, 'SAR', 90, ARRAY['monthly', 'yearly'], 'https://www.notion.so/settings'),
  ('Slack', 'productivity', 'https://logo.clearbit.com/slack.com', 24.99, 'SAR', 86, ARRAY['monthly'], 'https://slack.com/account/settings'),
  ('Zoom Pro', 'productivity', 'https://logo.clearbit.com/zoom.us', 54.99, 'SAR', 88, ARRAY['monthly', 'yearly'], 'https://zoom.us/account'),
  ('Canva Pro', 'productivity', 'https://logo.clearbit.com/canva.com', 44.99, 'SAR', 89, ARRAY['monthly', 'yearly'], 'https://www.canva.com/settings'),
  ('Grammarly Premium', 'productivity', 'https://logo.clearbit.com/grammarly.com', 49.99, 'SAR', 83, ARRAY['monthly', 'yearly'], 'https://account.grammarly.com/subscription'),
  ('LinkedIn Premium', 'productivity', 'https://logo.clearbit.com/linkedin.com', 119.99, 'SAR', 77, ARRAY['monthly'], 'https://www.linkedin.com/premium/manage'),
  
  -- Fitness & Health
  ('Peloton', 'fitness', 'https://logo.clearbit.com/onepeloton.com', 49.99, 'SAR', 81, ARRAY['monthly'], 'https://members.onepeloton.com/membership'),
  ('MyFitnessPal Premium', 'fitness', 'https://logo.clearbit.com/myfitnesspal.com', 34.99, 'SAR', 76, ARRAY['monthly', 'yearly'], 'https://www.myfitnesspal.com/account/premium'),
  ('Headspace', 'fitness', 'https://logo.clearbit.com/headspace.com', 44.99, 'SAR', 80, ARRAY['monthly', 'yearly'], 'https://www.headspace.com/subscriptions'),
  ('Calm', 'fitness', 'https://logo.clearbit.com/calm.com', 54.99, 'SAR', 79, ARRAY['monthly', 'yearly'], 'https://www.calm.com/account'),
  
  -- Gaming
  ('PlayStation Plus', 'gaming', 'https://logo.clearbit.com/playstation.com', 39.99, 'SAR', 91, ARRAY['monthly', 'yearly'], 'https://www.playstation.com/subscriptions'),
  ('Xbox Game Pass', 'gaming', 'https://logo.clearbit.com/xbox.com', 44.99, 'SAR', 93, ARRAY['monthly'], 'https://account.xbox.com/subscriptions'),
  ('Nintendo Switch Online', 'gaming', 'https://logo.clearbit.com/nintendo.com', 14.99, 'SAR', 85, ARRAY['monthly', 'yearly'], 'https://ec.nintendo.com/my/subscriptions'),
  ('EA Play', 'gaming', 'https://logo.clearbit.com/ea.com', 19.99, 'SAR', 74, ARRAY['monthly'], 'https://www.ea.com/ea-play'),
  
  -- News & Education
  ('New York Times', 'news', 'https://logo.clearbit.com/nytimes.com', 69.99, 'SAR', 78, ARRAY['monthly'], 'https://myaccount.nytimes.com/subscription'),
  ('Medium', 'news', 'https://logo.clearbit.com/medium.com', 19.99, 'SAR', 75, ARRAY['monthly', 'yearly'], 'https://medium.com/me/settings'),
  ('Coursera Plus', 'education', 'https://logo.clearbit.com/coursera.org', 199.99, 'SAR', 82, ARRAY['yearly'], 'https://www.coursera.org/programs'),
  ('Duolingo Plus', 'education', 'https://logo.clearbit.com/duolingo.com', 24.99, 'SAR', 87, ARRAY['monthly', 'yearly'], 'https://www.duolingo.com/settings/subscriptions');
