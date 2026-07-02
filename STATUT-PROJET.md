# Nativly — Statut du projet

> Dernière mise à jour : 2 juillet 2026
> Production : https://nativly-app.vercel.app
> Repo : https://github.com/JavaChrist/Nativly

---

## Vue d'ensemble

**Nativly** est une PWA d'apprentissage d'anglais par immersion thématique (musique en V1), avec une prof IA vocale, **Mei**.

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend / BDD | Supabase (Auth, Postgres, RLS) |
| IA texte | Claude (Anthropic) — analyse de paroles, évaluation orale |
| IA voix | ElevenLabs — TTS (voix Mei) + STT (transcription micro) |
| Déploiement | Vercel |

---

## Ce qui a été fait

### Infrastructure & déploiement

- [x] Projet Next.js 16 (App Router, Turbopack)
- [x] Déploiement Vercel (`nativly-app.vercel.app`)
- [x] Fix build Vercel — export `PasswordField`
- [x] Variables d'environnement (Supabase + Anthropic + ElevenLabs)
- [x] PWA : `manifest.json`, icônes, `appleWebApp` (installable iOS/Android)

### Authentification

- [x] Middleware Supabase SSR (`src/lib/supabase/middleware.ts`)
- [x] Email / mot de passe + inscription + reset password
- [x] Connexion Google OAuth
- [x] **Fix redirection login au 1er clic** — navigation pleine page après connexion (`window.location.assign`) pour garantir la transmission des cookies au middleware
- [x] Route callback auth (échange de code, messages d'erreur)

### Module Paroles (Musique)

- [x] Page `/music/lyrics` + API `/api/analyze-lyrics` (Claude)
- [x] Mode démo si clé Anthropic absente
- [x] Vocabulaire, idiomes, texte à trous, questions de compréhension, notes culturelles
- [x] **Texte à trous refondu** (`ClozeExerciseCard`) — lignes numérotées, indices
- [x] Persistance leçon + vocabulaire (utilisateur connecté)
- [x] **Brouillon local** (`draft-storage.ts`) — reprise de la saisie par navigateur
- [x] **Mes paroles sauvegardées** — `GET /api/lessons/lyrics` + `/[id]`, composant `SavedLyricsPicker`, réouverture d'une leçon

### Mei — prof IA vocale (nouveau)

- [x] Persona Mei (`src/lib/personas/mei.ts`), portrait `public/personas/`
- [x] Migration Supabase persona (`20250701100000_persona_mei_avatar.sql`) + `avatar_url`
- [x] API persona `GET /api/personas/music`
- [x] **TTS `POST /api/speech`** (ElevenLabs, fallback voix navigateur si pas de clé)
- [x] Hook `usePersonaSpeech` + composant `PersonaSpeaker` (Ecouter / Répéter / Plus lentement / Stop)
- [x] Champ `coachSpeechEn` dans l'analyse (Mei introduit la leçon en anglais)
- [x] **Parole automatique** après analyse et à la réouverture d'une leçon, avec **déverrouillage autoplay** au clic (contourne le blocage navigateur/iOS)
- [x] Mei lit et fait répéter le vocabulaire, corrige le texte à trous à voix haute

### Correction de prononciation — micro universel (nouveau)

- [x] **STT `POST /api/transcribe`** (ElevenLabs Scribe)
- [x] Hook `useMicTranscription` — capture `MediaRecorder`, envoi serveur, gestion permission/erreurs
- [x] `PronunciationCheck` rebranché : fonctionne sur **Chrome, Edge, Firefox, Safari et iOS** (l'ancienne API Web Speech ne marchait que sur Chrome/Edge)
- [x] Scoring Levenshtein + verdict (Parfait / Presque / À retravailler) + retour vocal de Mei

### Onboarding & Dashboard

- [x] Wizard `/onboarding` : intérêts, test écrit adaptatif, test oral (évalué par Claude), double niveau CECRL
- [x] `/dashboard` : niveaux CECRL, stats vocab / révisions / leçons

### Configuration

- [x] Séparation env client / serveur (`env.public.ts`, `env.server.ts`)
- [x] Modèle Claude par défaut : `claude-sonnet-4-6`

### Problèmes résolus en session (30 juin → 2 juillet)

| Problème | Cause | Solution |
|----------|-------|----------|
| Voix de Mei muette (bouton Stop sans son) | Clés ElevenLabs présentes dans l'éditeur mais **non sauvegardées sur le disque** → API 503 | Clés persistées dans `.env.local` |
| Mei ne parlait pas automatiquement | Autoplay bloqué après `fetch` async | Déverrouillage audio au clic + `speak()` déclenché après analyse |
| Re-login au 1er clic sur « Paroles » | Course cookies de session avec `router.push` | Navigation pleine page après login |
| Module « sans saisie » | Brouillon lié à l'origine (3000 vs 3001) | Un seul serveur dev sur 3000 |
| Lien « Paroles » sans effet | Déjà sur la page | `ScrollNavLink` → scroll vers le module |
| Micro non pris en compte | API Web Speech Chrome-only, invisible ailleurs | Micro serveur (MediaRecorder + ElevenLabs STT) |
| Plusieurs serveurs dev en parallèle | Process zombies ports 3000/3001 | Nettoyage + un seul serveur |

---

## Ce qui reste à faire

### Priorité haute

- [ ] **Chat interactif avec Mei** — dialogue temps réel (question/réponse) au-delà de la lecture de contenu
- [ ] **Page « Mes leçons » dédiée** — vue d'ensemble des analyses sauvegardées (au-delà du picker dans le module)
- [ ] **Interface révision SM-2** — révisions quotidiennes du vocabulaire appris (`review_schedule`)
- [ ] **Recalibrage onboarding** — flow `/onboarding?recalibrate=1` (middleware prêt, UI à polir)

### Priorité moyenne (V1.1)

- [ ] **Thèmes Voyage & Business** — marqués « Bientôt » sur l'accueil
- [ ] **Publier l'app Google OAuth** — sortir du mode test (100 users max)
- [ ] **Voix distinctes par persona** — Mei et futurs personas
- [ ] **Domaine personnalisé** (optionnel)

### Priorité basse / qualité

- [ ] **Migration `middleware.ts` → `proxy`** — Next.js 16 déprécie `middleware`
- [ ] **Tests automatisés** — auth, `analyze-lyrics`, onboarding, routes speech/transcribe
- [ ] **Nettoyer `useSpeechRecognition`** (legacy) si plus utilisé
- [ ] **Historique conversations** — table `conversation_sessions` non exploitée en UI

### Ops / sécurité

- [ ] Vérifier que les migrations SQL sont appliquées sur Supabase prod
- [ ] **Régénérer la clé ElevenLabs** (elle a transité en clair pendant le debug)
- [ ] Confirmer que `.env.local` est bien ignoré par git
- [ ] Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` / clés IA côté client

---

## Suggestions d'amélioration

### Pédagogie / produit

1. **Ralenti syllabe par syllabe** — pour la prononciation, faire répéter Mei mot → syllabes → mot.
2. **Objectif quotidien + série (streak)** — gamification légère pour l'engagement.
3. **Mise en évidence des mots pendant la lecture** — surligner les paroles au fil de la voix de Mei (karaoké).
4. **Niveau de difficulté adaptatif** — ajuster le nombre de trous et le vocabulaire selon le CECRL de l'utilisateur.
5. **Feedback prononciation plus fin** — signaler le(s) mot(s) mal prononcé(s) plutôt qu'un score global.

### Technique

6. **Cache TTS** — stocker les audios ElevenLabs déjà générés (Vercel Blob) pour réduire coût et latence.
7. **Limiter la durée d'enregistrement micro** — auto-stop après N secondes pour éviter les gros uploads.
8. **Rate limiting** sur `/api/speech` et `/api/transcribe** — protéger les crédits ElevenLabs.
9. **Skeletons / états de chargement** homogènes sur analyse et transcription.
10. **Analytics d'usage** (Vercel Analytics) — suivre l'engagement réel.

### iOS / PWA

11. **Écran d'installation guidé** — inviter à « Ajouter à l'écran d'accueil » sur iPhone.
12. **Vérifier le format audio Safari** (`audio/mp4`) de bout en bout sur un vrai device.
13. **Notifications de révision** (iOS 16.4+ PWA installée) pour rappeler les sessions SM-2.

---

## Structure des routes

```
/                      Accueil
/auth/login            Connexion / inscription
/auth/callback         Callback OAuth Supabase
/auth/reset-password   Nouveau mot de passe
/onboarding            Wizard niveau + intérêts
/music/lyrics          Module Paroles (Mei)
/dashboard             Progression
/api/analyze-lyrics    Analyse IA paroles (Claude)
/api/speech            Synthèse vocale Mei (ElevenLabs TTS)
/api/transcribe        Transcription micro (ElevenLabs STT)
/api/personas/music    Persona Mei
/api/lessons/lyrics     Leçons sauvegardées (liste + détail)
/api/onboarding/*      Complétion + évaluation orale
```

---

## Prochaine session suggérée

1. Tester en prod (HTTPS) sur iPhone : voix Mei + correction prononciation micro
2. Implémenter le **chat interactif avec Mei**
3. Construire l'**interface révision SM-2** (`review_schedule`)
4. Ajouter le **cache TTS** + rate limiting sur les routes voix
