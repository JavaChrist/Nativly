-- À exécuter UNIQUEMENT si une tentative précédente a échoué à mi-chemin
-- Supprime tout le schéma Nativly pour repartir de zéro

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop trigger if exists user_profile_updated_at on public.user_profile;
drop function if exists public.set_updated_at();

drop table if exists public.pronunciation_exercises cascade;
drop table if exists public.pronunciation_errors cascade;
drop table if exists public.conversation_sessions cascade;
drop table if exists public.review_schedule cascade;
drop table if exists public.vocabulary_items cascade;
drop table if exists public.lessons cascade;
drop table if exists public.placement_test_results cascade;
drop table if exists public.user_profile cascade;
drop table if exists public.personas cascade;
drop table if exists public.themes cascade;

drop type if exists placement_test_type cascade;
drop type if exists lesson_type cascade;
drop type if exists cefr_level cascade;
