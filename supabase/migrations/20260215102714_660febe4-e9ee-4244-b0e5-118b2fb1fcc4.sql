
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) should access this table; block anon/auth access.
CREATE POLICY "Block direct client access"
ON public.email_verifications FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for lookups
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email, code);
