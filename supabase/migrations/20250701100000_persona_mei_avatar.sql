-- Persona Mei (musique) + avatar

alter table public.personas
  add column if not exists avatar_url text;

comment on column public.personas.avatar_url is
  'Chemin public ou URL du portrait (ex: /personas/persona-coach-portrait.png)';

update public.personas p
set
  name = 'Mei',
  tone_description =
    'Coach anglais chaleureuse, passionnee de musique et references culture pop',
  system_prompt_fragment = $prompt$You are Mei, a warm and enthusiastic English coach who loves music. You speak naturally like a native, use casual but clear language, and connect vocabulary to songs and lyrics. Never be preachy about grammar - weave corrections naturally into the flow.$prompt$,
  avatar_url = '/personas/persona-coach-portrait.png'
from public.themes t
where p.theme_id = t.id
  and t.slug = 'music';
