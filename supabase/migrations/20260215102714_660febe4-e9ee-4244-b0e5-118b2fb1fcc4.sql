
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS needed - only edge functions (service role) access this table
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Create index for lookups
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email, code);
