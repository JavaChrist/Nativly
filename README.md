# Nativly

**Apprendre l'anglais par immersion thématique** — une PWA qui génère du contenu pédagogique à partir de vos centres d'intérêt réels (musique en V1), avec double niveau CECRL écrit/oral et coaching de prononciation par une prof IA, **Mei**.

- **Production** : https://nativly-app.vercel.app
- **Statut détaillé** : voir [`STATUT-PROJET.md`](./STATUT-PROJET.md)

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4 |
| Backend / BDD | Supabase (Auth, Postgres, RLS) |
| IA texte | Claude (Anthropic) — analyse de paroles, évaluation orale |
| IA voix | ElevenLabs — synthèse vocale (TTS) + reconnaissance vocale (STT / Scribe) |
| Déploiement | Vercel |

---

## Fonctionnalités clés

- **Authentification** email/mot de passe + Google OAuth (Supabase SSR).
- **Onboarding** : intérêts musicaux, test écrit adaptatif, test oral, double niveau CECRL.
- **Module Paroles** : collez des paroles → vocabulaire, idiomes, texte à trous, questions de compréhension, notes culturelles (via Claude).
- **Mei, prof IA vocale** : parle automatiquement après l'analyse, lit et fait répéter le vocabulaire, corrige le texte à trous à voix haute (ElevenLabs, fallback voix navigateur).
- **Correction de prononciation universelle** : capture micro (`MediaRecorder`) + transcription serveur ElevenLabs → fonctionne sur Chrome, Edge, Firefox, Safari **et iOS**.
- **Mes paroles sauvegardées** : réouverture des analyses enregistrées + brouillon local.
- **Dashboard** : niveaux CECRL, stats vocabulaire / révisions / leçons.
- **PWA** : installable sur l'écran d'accueil (iOS/Android), plein écran.

---

## Démarrage local

### Prérequis

- Node.js 20+
- Un projet Supabase et une clé API Anthropic (et ElevenLabs pour la voix)

### Installation

```bash
npm install
```

### Variables d'environnement

Copiez `.env.local.example` vers `.env.local` et renseignez :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...            # serveur uniquement

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-sonnet-4-6      # optionnel

# ElevenLabs (voix Mei + transcription)
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=...                  # voix féminine EN

# Debug pédagogique (local uniquement)
NATIVLY_DEBUG_PROMPTS=false
```

> Sans `ELEVENLABS_API_KEY`, la voix bascule sur la synthèse du navigateur et la correction de prononciation est désactivée. Sans `ANTHROPIC_API_KEY`, le module Paroles tourne en mode démo.

### Lancer le serveur

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

> Astuce : gardez **un seul** serveur dev actif. Si vous voyez « Port 3000 is in use … using 3001 », un ancien process traîne (les brouillons et cookies étant liés à l'origine, mélanger 3000/3001 crée des comportements incohérents).

---

## Scripts

| Script | Rôle |
|--------|------|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |

---

## Structure

```
src/
  app/
    api/
      analyze-lyrics/      Analyse IA des paroles (Claude)
      speech/              Synthèse vocale Mei (ElevenLabs TTS)
      transcribe/          Transcription micro (ElevenLabs STT)
      lessons/lyrics/      Leçons sauvegardées (liste + détail)
      onboarding/          Complétion + évaluation orale
      personas/music/      Persona Mei du module musique
    auth/                  login, callback, reset-password
    music/lyrics/          Module Paroles
    onboarding/            Wizard de niveau
    dashboard/             Progression
  components/
    lyrics/                Module Paroles (analyse, vocab, cloze, prononciation)
    persona/               PersonaSpeaker (Mei)
    auth/, layout/, onboarding/
  hooks/
    usePersonaSpeech.ts    Lecture voix + déverrouillage autoplay
    useMicTranscription.ts Capture micro + STT serveur
    useSpeechRecognition.ts (legacy Web Speech API)
  lib/
    prompts/, personas/, lyrics/, speech/, supabase/, types/
  config/
    env.public.ts, env.server.ts
supabase/migrations/        Schéma + seed + persona Mei
```

---

## Déploiement (Vercel)

1. Variables d'environnement à définir sur Vercel : mêmes que `.env.local` (les `NEXT_PUBLIC_*`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `SUPABASE_SERVICE_ROLE_KEY`).
2. Supabase → Authentication → URL Configuration : ajouter les Redirect URLs de prod **et** `http://localhost:3000/**` pour le dev.
3. `git push` sur `main` déclenche le déploiement.

> Le micro (`getUserMedia`) exige un contexte sécurisé : `localhost` en dev, HTTPS en prod. Pour tester la prononciation sur un vrai iPhone, utilisez l'URL Vercel (HTTPS).
