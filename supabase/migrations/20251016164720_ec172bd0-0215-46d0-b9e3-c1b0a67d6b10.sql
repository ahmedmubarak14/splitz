-- Create navigation preferences table
CREATE TABLE IF NOT EXISTS navigation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  visible_nav_items JSONB DEFAULT '["dashboard", "tasks", "focus", "expenses", "challenges"]'::jsonb,
  nav_order JSONB DEFAULT '["dashboard", "tasks", "focus", "expenses", "challenges"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE navigation_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own nav preferences"
ON navigation_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own nav preferences"
ON navigation_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nav preferences"
ON navigation_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_navigation_preferences_updated_at
BEFORE UPDATE ON navigation_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();