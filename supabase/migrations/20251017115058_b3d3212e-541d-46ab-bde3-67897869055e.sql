-- Add MENA-specific subscription templates (without ON CONFLICT)
INSERT INTO subscription_templates (name, category, logo_url, typical_price, typical_currency, popularity_score, billing_cycles, cancellation_url)
VALUES
  ('Starzplay', 'entertainment', 'https://logo.clearbit.com/starzplay.com', 29.99, 'SAR', 86, ARRAY['monthly'], 'https://starzplay.com/account'),
  ('TOD', 'entertainment', 'https://logo.clearbit.com/tod.tv', 20.00, 'SAR', 84, ARRAY['monthly'], 'https://tod.tv/settings'),
  ('Watch It', 'entertainment', 'https://logo.clearbit.com/watchit.com', 15.00, 'SAR', 82, ARRAY['monthly'], 'https://watchit.com/account'),
  ('Jawwy TV', 'entertainment', 'https://logo.clearbit.com/jawwy.tv', 25.00, 'SAR', 83, ARRAY['monthly'], 'https://jawwy.tv/account'),
  ('STC', 'telecom', 'https://logo.clearbit.com/stc.com.sa', 100.00, 'SAR', 90, ARRAY['monthly'], 'https://stc.com.sa/account'),
  ('Mobily', 'telecom', 'https://logo.clearbit.com/mobily.com.sa', 80.00, 'SAR', 88, ARRAY['monthly'], 'https://mobily.com.sa/account'),
  ('Zain', 'telecom', 'https://logo.clearbit.com/sa.zain.com', 90.00, 'SAR', 87, ARRAY['monthly'], 'https://sa.zain.com/account'),
  ('Virgin Mobile', 'telecom', 'https://logo.clearbit.com/virginmobile.sa', 50.00, 'SAR', 80, ARRAY['monthly'], 'https://virginmobile.sa/account'),
  ('HungerStation Plus', 'food', 'https://logo.clearbit.com/hungerstation.com', 29.99, 'SAR', 85, ARRAY['monthly'], 'https://hungerstation.com/account'),
  ('Jahez Plus', 'food', 'https://logo.clearbit.com/jahez.com', 19.99, 'SAR', 84, ARRAY['monthly'], 'https://jahez.com/account'),
  ('Noon Food', 'food', 'https://logo.clearbit.com/noonfood.com', 25.00, 'SAR', 82, ARRAY['monthly'], 'https://noonfood.com/account'),
  ('Careem Plus', 'transportation', 'https://logo.clearbit.com/careem.com', 19.99, 'SAR', 89, ARRAY['monthly'], 'https://careem.com/account'),
  ('Noon One', 'shopping', 'https://logo.clearbit.com/noon.com', 49.00, 'SAR', 86, ARRAY['yearly'], 'https://noon.com/account'),
  ('Namshi Premium', 'shopping', 'https://logo.clearbit.com/namshi.com', 15.00, 'SAR', 78, ARRAY['monthly'], 'https://namshi.com/account'),
  ('STC Pay Premium', 'finance', 'https://logo.clearbit.com/stcpay.com.sa', 9.99, 'SAR', 81, ARRAY['monthly'], 'https://stcpay.com.sa/account');