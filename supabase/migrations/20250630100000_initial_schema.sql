-- Nativly — schéma initial
-- Relations : auth.users → user_profile (1:1)
-- themes → personas (1:1 pour le moment)
-- user + theme → lessons → vocabulary_items → review_schedule

-- Extensions utiles
create extension if not exists "pgcrypto";

-- Niveaux CECRL
create type cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1');

-- Types de leçon (extensible multi-thèmes)
create type lesson_type as enum (
  'lyrics_analysis',
  'conversation',
  'placement_written',
  'placement_oral',
  'pronunciation_drill'
);

-- Type de test de placement
create type placement_test_type as enum ('written', 'oral');

-- ─── Thèmes ───────────────────────────────────────────────────────────────────

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Personas IA (une par thème) ──────────────────────────────────────────────

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes(id) on delete cascade,
  name text not null,
  tone_description text,
  system_prompt_fragment text not null,
  voice_id text,
  created_at timestamptz not null default now(),
  unique (theme_id)
);

-- ─── Profil utilisateur ───────────────────────────────────────────────────────

create table public.user_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  written_cefr_level cefr_level not null default 'A2',
  spoken_fluency_cefr_level cefr_level not null default 'A2',
  last_calibrated_at timestamptz,
  interests_json jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ─── Résultats test de placement ──────────────────────────────────────────────

create table public.placement_test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  test_type placement_test_type not null,
  score_detail_json jsonb not null default '{}'::jsonb,
  resulting_cefr_level cefr_level not null,
  taken_at timestamptz not null default now()
);

-- ─── Leçons générées ──────────────────────────────────────────────────────────

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id uuid not null references public.themes(id) on delete restrict,
  title text not null,
  source_content text not null,
  generated_content_json jsonb,
  type lesson_type not null,
  target_cefr_level cefr_level not null,
  generated_at timestamptz not null default now()
);

-- ─── Vocabulaire extrait ──────────────────────────────────────────────────────

create table public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  translation text not null,
  context_sentence text,
  difficulty cefr_level,
  lesson_id uuid references public.lessons(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Répétition espacée (SM-2 simplifié) ──────────────────────────────────────

create table public.review_schedule (
  id uuid primary key default gen_random_uuid(),
  vocabulary_item_id uuid not null references public.vocabulary_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  next_review_date date not null default current_date,
  ease_factor numeric(4, 2) not null default 2.5,
  interval_days integer not null default 1,
  repetition_count integer not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (vocabulary_item_id)
);

-- ─── Sessions de conversation ─────────────────────────────────────────────────

create table public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id uuid not null references public.themes(id) on delete restrict,
  persona_id uuid references public.personas(id) on delete set null,
  title text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary text,
  mistakes_summary jsonb,
  audio_duration_seconds integer
);

-- ─── Erreurs de prononciation ───────────────────────────────────────────────────

create table public.pronunciation_errors (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.conversation_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  phoneme_or_sound text not null,
  word text,
  accuracy_score numeric(5, 2),
  occurred_at timestamptz not null default now()
);

-- ─── Exercices de prononciation ciblés ────────────────────────────────────────

create table public.pronunciation_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_sound text not null,
  exercise_content jsonb not null,
  generated_at timestamptz not null default now(),
  completed boolean not null default false,
  completed_at timestamptz
);

-- ─── Index ────────────────────────────────────────────────────────────────────

create index idx_user_profile_user_id on public.user_profile(user_id);
create index idx_lessons_user_theme on public.lessons(user_id, theme_id);
create index idx_vocabulary_user on public.vocabulary_items(user_id);
create index idx_review_schedule_user_date on public.review_schedule(user_id, next_review_date);
create index idx_conversation_sessions_user on public.conversation_sessions(user_id);
create index idx_pronunciation_errors_user on public.pronunciation_errors(user_id, phoneme_or_sound);

-- ─── Données initiales : thèmes + persona musique ─────────────────────────────

insert into public.themes (slug, name, description, is_active) values
  ('music', 'Musique', 'Apprendre l''anglais à travers vos chansons préférées', true),
  ('travel', 'Voyage', 'Préparez vos conversations pour vos prochains voyages', false),
  ('business', 'Business', 'Anglais professionnel adapté à votre secteur', false);

insert into public.personas (theme_id, name, tone_description, system_prompt_fragment, voice_id)
select
  t.id,
  'Jamie',
  'Guide décontracté, passionné de musique, références culturelles pop et rock',
  $prompt$You are Jamie, a warm and enthusiastic music-loving English conversation partner. You speak naturally like a native, use casual but clear language, and connect vocabulary to songs and lyrics. Never be preachy about grammar - weave corrections naturally into the flow.$prompt$,
  null
from public.themes t where t.slug = 'music';

insert into public.personas (theme_id, name, tone_description, system_prompt_fragment, voice_id)
select
  t.id,
  'Alex',
  'Guide voyage chaleureux et curieux',
  $prompt$You are Alex, a friendly travel guide who helps learners practice real-world travel English with warmth and patience.$prompt$,
  null
from public.themes t where t.slug = 'travel';

insert into public.personas (theme_id, name, tone_description, system_prompt_fragment, voice_id)
select
  t.id,
  'Morgan',
  'Coach professionnel, direct et structuré',
  $prompt$You are Morgan, a professional English coach focused on clear business communication. You are supportive but precise.$prompt$,
  null
from public.themes t where t.slug = 'business';

-- ─── Trigger updated_at ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profile_updated_at
  before update on public.user_profile
  for each row execute function public.set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.themes enable row level security;
alter table public.personas enable row level security;
alter table public.user_profile enable row level security;
alter table public.placement_test_results enable row level security;
alter table public.lessons enable row level security;
alter table public.vocabulary_items enable row level security;
alter table public.review_schedule enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.pronunciation_errors enable row level security;
alter table public.pronunciation_exercises enable row level security;

-- Thèmes et personas : lecture publique
create policy "themes_read_all" on public.themes for select using (true);
create policy "personas_read_all" on public.personas for select using (true);

-- Profil utilisateur
create policy "user_profile_select_own" on public.user_profile
  for select using (auth.uid() = user_id);
create policy "user_profile_insert_own" on public.user_profile
  for insert with check (auth.uid() = user_id);
create policy "user_profile_update_own" on public.user_profile
  for update using (auth.uid() = user_id);

-- Données utilisateur : accès strictement privé
create policy "placement_test_select_own" on public.placement_test_results
  for select using (auth.uid() = user_id);
create policy "placement_test_insert_own" on public.placement_test_results
  for insert with check (auth.uid() = user_id);

create policy "lessons_select_own" on public.lessons
  for select using (auth.uid() = user_id);
create policy "lessons_insert_own" on public.lessons
  for insert with check (auth.uid() = user_id);
create policy "lessons_update_own" on public.lessons
  for update using (auth.uid() = user_id);
create policy "lessons_delete_own" on public.lessons
  for delete using (auth.uid() = user_id);

create policy "vocabulary_select_own" on public.vocabulary_items
  for select using (auth.uid() = user_id);
create policy "vocabulary_insert_own" on public.vocabulary_items
  for insert with check (auth.uid() = user_id);
create policy "vocabulary_update_own" on public.vocabulary_items
  for update using (auth.uid() = user_id);
create policy "vocabulary_delete_own" on public.vocabulary_items
  for delete using (auth.uid() = user_id);

create policy "review_select_own" on public.review_schedule
  for select using (auth.uid() = user_id);
create policy "review_insert_own" on public.review_schedule
  for insert with check (auth.uid() = user_id);
create policy "review_update_own" on public.review_schedule
  for update using (auth.uid() = user_id);
create policy "review_delete_own" on public.review_schedule
  for delete using (auth.uid() = user_id);

create policy "conversation_select_own" on public.conversation_sessions
  for select using (auth.uid() = user_id);
create policy "conversation_insert_own" on public.conversation_sessions
  for insert with check (auth.uid() = user_id);
create policy "conversation_update_own" on public.conversation_sessions
  for update using (auth.uid() = user_id);

create policy "pronunciation_errors_select_own" on public.pronunciation_errors
  for select using (auth.uid() = user_id);
create policy "pronunciation_errors_insert_own" on public.pronunciation_errors
  for insert with check (auth.uid() = user_id);

create policy "pronunciation_exercises_select_own" on public.pronunciation_exercises
  for select using (auth.uid() = user_id);
create policy "pronunciation_exercises_insert_own" on public.pronunciation_exercises
  for insert with check (auth.uid() = user_id);
create policy "pronunciation_exercises_update_own" on public.pronunciation_exercises
  for update using (auth.uid() = user_id);

-- Creation automatique du profil a l inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profile (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Commentaires PostgreSQL (visibles dans le dashboard Supabase) ─────────────
-- Dollar-quoting ($c$...) pour eviter les erreurs d apostrophes dans le SQL Editor

comment on table public.themes is
  'Themes d apprentissage (musique, voyage, business). Referentiel partage, lecture publique.';

comment on table public.personas is
  'Personas IA associees a chaque theme (nom, ton, fragment de system prompt, voice_id TTS).';

comment on table public.user_profile is
  'Profil pedagogique utilisateur : double niveau CECRL (ecrit/oral), interets onboarding.';

comment on table public.placement_test_results is
  'Historique des tests de placement (volet ecrit ou oral) et niveau CECRL resultant.';

comment on table public.lessons is
  'Lecons generees par IA a partir du contenu apporte par l utilisateur (paroles, scenarios).';

comment on table public.vocabulary_items is
  'Mots et expressions extraits des lecons, ajoutes a la revision personnelle.';

comment on table public.review_schedule is
  'Planification SM-2 : prochaine date de revision par mot de vocabulaire.';

comment on table public.conversation_sessions is
  'Sessions de conversation vocale avec une persona IA (module prononciation).';

comment on table public.pronunciation_errors is
  'Erreurs de prononciation detectees (Azure) pendant une session, par phoneme/mot.';

comment on table public.pronunciation_exercises is
  'Exercices de prononciation cibles generes a partir des erreurs recurrentes.';

comment on column public.themes.slug is 'Identifiant technique unique (ex: music, travel, business)';
comment on column public.themes.name is 'Titre affiche du theme (ex: Musique, Voyage)';
comment on column public.themes.is_active is 'Theme disponible dans l app (seul musique actif en V1)';

comment on column public.personas.name is 'Prenom de la persona IA (ex: Jamie, Alex, Morgan)';
comment on column public.personas.tone_description is 'Description courte du ton et de la personnalite';
comment on column public.personas.system_prompt_fragment is 'Fragment injecte dans le system prompt Claude';
comment on column public.personas.voice_id is 'Identifiant voix TTS (ElevenLabs ou autre)';

comment on column public.user_profile.written_cefr_level is 'Niveau CECRL comprehension/grammaire (A1-C1)';
comment on column public.user_profile.spoken_fluency_cefr_level is 'Niveau CECRL fluidite orale (A1-C1)';
comment on column public.user_profile.interests_json is 'Interets precis captes a l onboarding (genre, artiste, destination)';

comment on column public.placement_test_results.title is 'Titre lisible (ex: Test ecrit - B1 - 30/06/2026, Test oral - recalibrage)';
comment on column public.placement_test_results.test_type is 'Volet du test : written (ecrit) ou oral';
comment on column public.placement_test_results.score_detail_json is 'Detail des reponses et scores par question';

comment on column public.lessons.title is 'Titre lisible pour identifier la lecon (ex: Paroles - Let It Be)';
comment on column public.lessons.source_content is 'Contenu source prive colle par l utilisateur (paroles, texte)';
comment on column public.lessons.generated_content_json is 'Resultat JSON complet de la generation IA';
comment on column public.lessons.type is 'Type de lecon : lyrics_analysis, conversation, placement_*, pronunciation_drill';

comment on column public.vocabulary_items.word is 'Mot ou expression en anglais';
comment on column public.vocabulary_items.translation is 'Traduction en francais';
comment on column public.vocabulary_items.context_sentence is 'Extrait court de contexte (max 15 mots, pas les paroles completes)';

comment on column public.review_schedule.ease_factor is 'Facteur de facilite SM-2 (defaut 2.5)';
comment on column public.review_schedule.interval_days is 'Intervalle en jours avant la prochaine revision';

comment on column public.conversation_sessions.title is 'Titre lisible (ex: Session musique - Jamie - 30/06/2026)';
comment on column public.conversation_sessions.mistakes_summary is 'Resume JSON des erreurs grammaire + prononciation en fin de session';

comment on column public.pronunciation_errors.phoneme_or_sound is 'Son ou phoneme problematique (ex: th, vowel_long_a)';
comment on column public.pronunciation_errors.accuracy_score is 'Score de precision Azure (0-100)';

comment on column public.pronunciation_exercises.title is 'Titre lisible de l exercice (ex: Travail du son th)';
comment on column public.pronunciation_exercises.target_sound is 'Son cible de l exercice';
comment on column public.pronunciation_exercises.exercise_content is 'Contenu JSON de l exercice (paires de mots, virelangues)';
