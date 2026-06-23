
CREATE TABLE public.audio_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transcription_id uuid NOT NULL REFERENCES public.transcriptions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_chat_messages TO authenticated;
GRANT ALL ON public.audio_chat_messages TO service_role;

ALTER TABLE public.audio_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own chat messages"
  ON public.audio_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own chat messages"
  ON public.audio_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own chat messages"
  ON public.audio_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_audio_chat_messages_transcription ON public.audio_chat_messages(transcription_id, created_at);
