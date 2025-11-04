-- Create packing_lists table
CREATE TABLE public.packing_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  is_packed BOOLEAN DEFAULT false,
  added_by UUID NOT NULL,
  packed_by UUID,
  packed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packing_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packing_lists
CREATE POLICY "Trip members can view packing lists"
  ON public.packing_lists FOR SELECT
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can add packing items"
  ON public.packing_lists FOR INSERT
  WITH CHECK (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can update packing items"
  ON public.packing_lists FOR UPDATE
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can delete packing items"
  ON public.packing_lists FOR DELETE
  USING (is_trip_member(auth.uid(), trip_id));

-- Create itinerary_items table
CREATE TABLE public.itinerary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  activity_type TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for itinerary_items
CREATE POLICY "Trip members can view itinerary"
  ON public.itinerary_items FOR SELECT
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can add itinerary items"
  ON public.itinerary_items FOR INSERT
  WITH CHECK (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can update itinerary items"
  ON public.itinerary_items FOR UPDATE
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can delete itinerary items"
  ON public.itinerary_items FOR DELETE
  USING (is_trip_member(auth.uid(), trip_id));

-- Create trip_templates table
CREATE TABLE public.trip_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT DEFAULT '✈️',
  default_packing_items JSONB DEFAULT '[]',
  default_tasks JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_templates
CREATE POLICY "Anyone can view trip templates"
  ON public.trip_templates FOR SELECT
  USING (true);

-- Insert default templates
INSERT INTO public.trip_templates (name, description, category, icon, default_packing_items, default_tasks) VALUES
(
  'Beach Vacation',
  'Relaxing beach getaway with sun and sand',
  'leisure',
  '🏖️',
  '[
    {"name": "Swimsuit", "category": "Clothing"},
    {"name": "Sunscreen", "category": "Toiletries"},
    {"name": "Beach towel", "category": "Accessories"},
    {"name": "Sunglasses", "category": "Accessories"},
    {"name": "Flip flops", "category": "Footwear"}
  ]',
  '[
    {"title": "Book accommodation", "priority": "high"},
    {"title": "Reserve beach chairs", "priority": "medium"},
    {"title": "Pack beach gear", "priority": "medium"}
  ]'
),
(
  'Business Trip',
  'Professional travel for work meetings',
  'business',
  '💼',
  '[
    {"name": "Business attire", "category": "Clothing"},
    {"name": "Laptop", "category": "Electronics"},
    {"name": "Chargers", "category": "Electronics"},
    {"name": "Business cards", "category": "Documents"},
    {"name": "Presentation materials", "category": "Documents"}
  ]',
  '[
    {"title": "Prepare presentation", "priority": "high"},
    {"title": "Book meeting rooms", "priority": "high"},
    {"title": "Arrange airport transfer", "priority": "medium"}
  ]'
),
(
  'Adventure Trip',
  'Outdoor adventure and exploration',
  'adventure',
  '🏔️',
  '[
    {"name": "Hiking boots", "category": "Footwear"},
    {"name": "Backpack", "category": "Accessories"},
    {"name": "Water bottle", "category": "Accessories"},
    {"name": "First aid kit", "category": "Safety"},
    {"name": "Camera", "category": "Electronics"}
  ]',
  '[
    {"title": "Research hiking trails", "priority": "high"},
    {"title": "Check weather forecast", "priority": "high"},
    {"title": "Book guide services", "priority": "medium"}
  ]'
),
(
  'Family Vacation',
  'Fun family trip for all ages',
  'family',
  '👨‍👩‍👧‍👦',
  '[
    {"name": "Snacks", "category": "Food"},
    {"name": "Entertainment for kids", "category": "Entertainment"},
    {"name": "Family games", "category": "Entertainment"},
    {"name": "Camera", "category": "Electronics"},
    {"name": "First aid kit", "category": "Safety"}
  ]',
  '[
    {"title": "Book family-friendly accommodation", "priority": "high"},
    {"title": "Plan kid-friendly activities", "priority": "high"},
    {"title": "Pack entertainment", "priority": "medium"}
  ]'
);

-- Trigger for updated_at
CREATE TRIGGER update_packing_lists_updated_at
  BEFORE UPDATE ON public.packing_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();