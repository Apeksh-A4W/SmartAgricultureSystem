-- Alert type and severity enums
CREATE TYPE public.alert_type AS ENUM ('pest', 'animal', 'disease', 'weather');
CREATE TYPE public.alert_severity AS ENUM ('red', 'yellow', 'green');

-- Alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type public.alert_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'yellow',
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 500),
  image_url TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_created_at ON public.alerts (created_at DESC);
CREATE INDEX idx_alerts_location ON public.alerts (latitude, longitude);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Anyone can read alerts (so nearby farmers, even guests, can see warnings)
CREATE POLICY "Alerts are viewable by everyone"
  ON public.alerts FOR SELECT
  USING (true);

-- Only authenticated users can create, and only as themselves
CREATE POLICY "Authenticated users can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- updated_at trigger function (shared)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for alert photos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('farm-alerts', 'farm-alerts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated write into own folder
CREATE POLICY "Alert images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'farm-alerts');

CREATE POLICY "Authenticated users can upload alert images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'farm-alerts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own alert images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'farm-alerts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own alert images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'farm-alerts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );