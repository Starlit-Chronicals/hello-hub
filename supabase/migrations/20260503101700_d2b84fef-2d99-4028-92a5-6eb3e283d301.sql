CREATE TABLE public.link_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  url TEXT NOT NULL CHECK (char_length(url) BETWEEN 1 AND 500),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.link_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view link requests"
  ON public.link_requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit a link request"
  ON public.link_requests FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Owners can update their requests"
  ON public.link_requests FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Owners can delete their requests"
  ON public.link_requests FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE INDEX link_requests_created_at_idx ON public.link_requests (created_at DESC);