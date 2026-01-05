-- Create observations table for storing curated news/observations
CREATE TABLE public.observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_it TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  micro_judgment_en TEXT,
  micro_judgment_it TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create objects table for storing curated Amazon objects
CREATE TABLE public.objects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_it TEXT,
  price TEXT NOT NULL,
  amazon_url_com TEXT,
  amazon_url_it TEXT,
  image_url TEXT,
  micro_judgment_en TEXT,
  micro_judgment_it TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

-- Public read access for approved content only
CREATE POLICY "Anyone can view approved observations" 
ON public.observations 
FOR SELECT 
USING (approved = true);

CREATE POLICY "Anyone can view approved objects" 
ON public.objects 
FOR SELECT 
USING (approved = true);