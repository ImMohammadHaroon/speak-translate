
CREATE TABLE public.transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  detected_language TEXT,
  transcription TEXT NOT NULL,
  translation TEXT,
  is_english BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transcriptions"
ON public.transcriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transcriptions"
ON public.transcriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcriptions"
ON public.transcriptions FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON public.transcriptions(created_at DESC);
