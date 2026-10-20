-- The app no longer stores accounts, transcripts, or chats.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists update_profiles_updated_at on public.profiles;

drop function if exists public.handle_new_user();
drop function if exists public.update_updated_at_column();

drop table if exists public.audio_chat_messages cascade;
drop table if exists public.transcriptions cascade;
drop table if exists public.email_verifications cascade;
drop table if exists public.profiles cascade;
