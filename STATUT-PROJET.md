# Nativly — Statut du projet

> Dernière mise à jour : 30 juin 2025  
> Production : https://nativly-app.vercel.app

---

## Vue d'ensemble

**Nativly** est une PWA d'apprentissage d'anglais par immersion thématique (musique en V1).

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend / BDD | Supabase (Auth, Postgres, RLS) |
| IA | Claude (Anthropic) — analyse de paroles, évaluation orale |
| Déploiement | Vercel |

---

## Ce qui a été fait

### Infrastructure & déploiement

- [x] Projet Next.js initialisé avec structure App Router
- [x] Déploiement Vercel fonctionnel (`nativly-app.vercel.app`)
- [x] Fix build Vercel — export `PasswordField` corrigé
- [x] Variables d'environnement Vercel configurées (Supabase + Anthropic)
- [x] Logos PWA / favicon personnalisés dans `public/`
- [x] `manifest.json` mis à jour

### Base de données Supabase

- [x] Migration initiale (`supabase/migrations/20250630100000_initial_schema.sql`)
  - Tables : `themes`, `personas`, `user_profile`, `placement_test_results`, `lessons`, `vocabulary_items`, `review_schedule`, `conversation_sessions`, etc.
- [x] RLS activé sur les tables exposées
- [x] Profil utilisateur auto-créé à l'inscription
- [x] Données seed : 3 thèmes, 3 personas (Jamie, Alex, Morgan)

### Authentification

- [x] Middleware Supabase SSR (`src/middleware.ts`, `src/lib/supabase/middleware.ts`)
- [x] Pages : `/auth/login`, `/auth/callback`, `/auth/reset-password`
- [x] Connexion email / mot de passe
- [x] Inscription avec confirmation email
- [x] Mot de passe oublié + réinitialisation
- [x] Composant `PasswordField` avec affichage/masquage
- [x] **Connexion Google OAuth** (Google Cloud + Supabase)
- [x] Route callback auth améliorée (cookies session, messages d'erreur détaillés)
- [x] `AuthButton` dans la navigation

### Module Paroles (Musique)

- [x] Page `/music/lyrics`
- [x] API `/api/analyze-lyrics` — analyse IA via Claude
- [x] Mode démo si clé Anthropic absente
- [x] Persistance leçon + vocabulaire SM-2 (utilisateur connecté)
- [x] Prompts dans `src/lib/prompts/analyze-lyrics.ts`

### Onboarding

- [x] Page `/onboarding` — wizard complet
- [x] Intérêts musicaux
- [x] Test écrit adaptatif (8 questions)
- [x] Test oral (texte EN saisi par l'utilisateur, évalué par Claude — **pas de voix IA**)
- [x] APIs : `/api/onboarding/complete`, `/api/onboarding/evaluate-oral`
- [x] Double niveau CECRL écrit / oral enregistré en BDD

### IA & contenu pédagogique

- [x] Analyse de paroles via Claude (texte)
- [x] Évaluation orale onboarding via Claude (texte)
- [ ] **IA qui parle pour les cours** — non implémenté (voir section « À faire »)

### Dashboard

- [x] Page `/dashboard` — niveaux CECRL, stats vocab / révisions / leçons

### Configuration

- [x] Séparation env client / serveur (`src/config/env.public.ts`, `env.server.ts`)
- [x] Modèle Claude par défaut : `claude-sonnet-4-6`
- [x] `.env.local.example` documenté

### Problèmes résolus en session

| Problème | Solution |
|----------|----------|
| Build Vercel échouait | Export `PasswordField` manquant |
| Invalid API key | URL Supabase (`fkwzmecpmsuohvweomwu`) + clé publishable du **même** projet |
| Connexion Google échouait | Client OAuth Google + clés Supabase alignées + Redirect URLs |
| URL Vercel avec suffixe | Renommé en `nativly-app.vercel.app` |
| Erreurs `play.google.com/log` | Bloqueur de pub Brave — sans impact sur l'auth |

---

## Configuration production (référence)

### Vercel — variables obligatoires

```
NEXT_PUBLIC_SUPABASE_URL=https://fkwzmecpmsuohvweomwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (même projet)
ANTHROPIC_API_KEY=sk-ant-...
```

Optionnel : `ANTHROPIC_MODEL` (défaut `claude-sonnet-4-6`)

### Supabase — Authentication → URL Configuration

| Champ | Valeur |
|-------|--------|
| Site URL | `https://nativly-app.vercel.app` |
| Redirect URLs | `https://nativly-app.vercel.app/auth/callback` |
| | `https://nativly-app.vercel.app/auth/reset-password` |
| | `http://localhost:3000/auth/callback` |
| | `http://localhost:3000/auth/reset-password` |

### Google OAuth

- Callback Google : `https://fkwzmecpmsuohvweomwu.supabase.co/auth/v1/callback`
- App en **mode test** — utilisateurs test à ajouter manuellement dans Google Auth Platform
- Origines JS : `https://nativly-app.vercel.app`, `http://localhost:3000`

---

## Ce qui reste à faire

### Priorité haute (MVP+)

- [ ] **IA vocale pour les cours** — voix qui lit / explique le contenu pédagogique (voir détail ci-dessous)
- [ ] **Historique « Mes leçons »** — lister les analyses sauvegardées dans l'app
- [ ] **Interface révision SM-2** — révisions quotidiennes du vocabulaire appris
- [ ] **Recalibrage onboarding** — flow via `/onboarding?recalibrate=1` (middleware prêt, UI à polir)

#### IA vocale pour les cours (à concevoir)

Objectif : une **IA qui parle** pendant les leçons — lecture des explications, dialogues avec les personas (Jamie, Alex, Morgan), coaching prononciation natif annoncé sur l'accueil.

| Brique | Statut | Notes |
|--------|--------|-------|
| Synthèse vocale (TTS) — l'IA parle | [ ] | Azure Speech ou ElevenLabs (placeholders dans `.env.local.example`) |
| Reconnaissance vocale (STT) — l'utilisateur répond | [ ] | Azure Speech — pour test oral réel (micro, pas saisie texte) |
| API route serveur TTS/STT | [ ] | Clés secrètes côté serveur uniquement |
| Lecteur audio dans les leçons | [ ] | UI sur `/music/lyrics` et futures pages cours |
| Personas avec voix distinctes | [ ] | Table `personas` en seed, voix à associer par persona |
| Évaluation prononciation | [ ] | Azure Pronunciation Assessment ou équivalent |

Variables env prévues (non branchées) :
```
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
ELEVENLABS_API_KEY=
```

### Priorité moyenne (V1.1)

- [ ] **Thèmes Voyage & Business** — actuellement marqués « Bientôt » sur l'accueil
- [ ] **Publier l'app Google OAuth** — sortir du mode test (100 users max) + validation Google si besoin
- [ ] **Domaine personnalisé** — ex. `nativly.com` (optionnel, `nativly-app.vercel.app` suffit pour l'instant)

### Priorité basse / qualité

- [ ] **Middleware → proxy** — Next.js 16 déprécie `middleware.ts` au profit de `proxy`
- [ ] **Tests automatisés** — auth, API analyze-lyrics, onboarding
- [ ] **Page erreur auth dédiée** — remplacer le message générique sur `/auth/login`
- [ ] **Historique conversations** — table `conversation_sessions` créée mais non exploitée en UI
- [ ] **Personas interactifs** — Jamie, Alex, Morgan en seed mais pas encore utilisés dans l'UI

### Ops / sécurité

- [ ] Vérifier que les migrations SQL sont bien appliquées sur le projet Supabase prod (`fkwzmecpmsuohvweomwu`)
- [ ] Ne **pas** exposer `SUPABASE_SERVICE_ROLE_KEY` ni `ANTHROPIC_API_KEY` côté client
- [ ] Rotation des clés si elles ont été partagées en clair (logs, captures)

---

## Structure des routes

```
/                     Accueil
/auth/login           Connexion / inscription
/auth/callback        Callback OAuth Supabase
/auth/reset-password  Nouveau mot de passe
/onboarding           Wizard niveau + intérêts
/music/lyrics         Module Paroles
/dashboard            Progression
/api/analyze-lyrics   Analyse IA paroles
/api/onboarding/*     Complétion + évaluation orale
```

---

## Commits récents

```
44c1c5a mise en place authentification google
edbbc90 fix: exporter PasswordField pour corriger le build Vercel
eb43d35 Premier MVP fonctionnel : login, onboarding, analyse de paroles et persistance Supabase
```

---

## Prochaine session suggérée

1. Tester le parcours complet en prod : login Google → onboarding → analyse paroles → dashboard
2. **Cadrer l'IA vocale** — choix Azure vs ElevenLabs, premier flux « lire une leçon à voix haute »
3. Implémenter **« Mes leçons »** (lecture des `lessons` en BDD)
4. Commencer l'**interface révision SM-2** (`review_schedule`)
