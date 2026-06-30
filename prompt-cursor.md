# Prompt Cursor — App d'apprentissage de l'anglais par immersion thématique

## Contexte projet

Je suis développeur freelance (React, Next.js, TypeScript, Tailwind, Supabase, Vercel). Je construis une PWA d'apprentissage de l'anglais destinée dans un premier temps à mon usage personnel, avec l'intention de la commercialiser ensuite en SaaS freemium.

**Positionnement différenciant** : contrairement à Duolingo/Babbel (progression linéaire par niveau scolaire, contenu générique), cette app propose un apprentissage par **centres d'intérêt réels** (musique, voyage, business, cinéma...) avec du contenu **généré dynamiquement par IA** et adapté au matériau que l'utilisateur apporte lui-même (paroles de ses chansons préférées, scénarios de voyage qu'il prépare réellement, etc.). L'objectif n'est pas la gamification superficielle mais la **rétention réelle** : vocabulaire et expressions idiomatiques ancrés dans un contexte émotionnellement signifiant pour l'utilisateur.

**Benchmark concurrentiel — Learna AI** (référence directe à dépasser) : c'est un tuteur IA conversationnel avec personnages virtuels et feedback de prononciation, mais les retours utilisateurs pointent des faiblesses précises qu'il faut éviter ici : qualité vocale TTS peu réaliste (pas un vrai accent natif), problèmes récurrents de reconnaissance vocale qui cassent la fluidité de la conversation, impossibilité de rejouer les messages audio, contenu thématique qui reste générique malgré le ciblage par thème, et un modèle freemium perçu comme trompeur (annoncé gratuit puis bloqué). Cette app doit explicitement corriger ces points : TTS qualité native (ElevenLabs) avec replay audio illimité au clic sur n'importe quel mot, scoring de prononciation fiable (Azure Pronunciation Assessment plutôt que STT classique bricolé), personnalisation par le contenu réel apporté par l'utilisateur plutôt que du contenu thématique générique, et un test de niveau initial à deux dimensions (écrit/oral) qui calibre réellement le contenu généré au lieu d'un niveau global approximatif.

## Stack technique imposée

- Next.js 14+ (App Router) + TypeScript strict
- Tailwind CSS pour le style, design épuré et moderne (pas de template générique type shadcn par défaut — je veux une identité visuelle propre)
- Supabase : auth (email + Google OAuth), base de données Postgres, stockage fichiers
- PWA : installable, fonctionnement offline partiel (cache des leçons déjà générées)
- API IA : Claude (Anthropic API) pour la génération de contenu pédagogique et les conversations
- Voix : Speech-to-text (Whisper API) + évaluation de prononciation dédiée (Azure Speech Pronunciation Assessment à évaluer en priorité) + Text-to-speech (ElevenLabs ou alternative, à comparer sur coût/latence/qualité d'accent)
- Déploiement Vercel via GitHub
- Mollie pour la monétisation (à prévoir en architecture mais pas à implémenter en V1)

## Phase 1 — MVP personnel (ce qu'on construit maintenant)

Un seul thème complet et fonctionnel : **musique**. Les autres thèmes (voyage, business) doivent être prévus dans l'architecture mais pas développés tout de suite.

### Fonctionnalité cœur : module "Paroles"

1. L'utilisateur colle les paroles d'une chanson qu'il aime (champ texte libre)
2. L'IA analyse le texte et génère :
   - Une liste de vocabulaire clé (mots/expressions) avec traduction et niveau de difficulté estimé
   - Les expressions idiomatiques ou tournures non littérales expliquées en contexte
   - Un exercice "texte à trous" (les mots-clés sont masqués, l'utilisateur doit les retrouver à l'écoute/relecture)
   - 3-5 questions de compréhension ou de réflexion sur le sens du texte
3. Le vocabulaire extrait est automatiquement ajouté à la base de révision personnelle de l'utilisateur (système de répétition espacée)

### Fonctionnalité 0 : test de niveau initial (onboarding)

Avant toute leçon, l'utilisateur passe un test d'évaluation qui détermine son niveau CECRL de départ (A1 à C1) et calibre tout le reste de l'app dessus.

**Composition du test** :
- Volet écrit : questions de grammaire/vocabulaire à difficulté croissante (adaptatif — si l'utilisateur réussit, les questions suivantes montent en difficulté ; logique proche d'un CAT, "Computerized Adaptive Testing", pour aller vite sans faire 50 questions à tout le monde)
- Volet oral court : 2-3 prompts où l'utilisateur doit parler quelques phrases, transcrits via Whisper simple (sans scoring phonétique fin à ce stade) pour évaluer la fluidité globale, la richesse du vocabulaire utilisé spontanément et la structure grammaticale à l'oral — l'objectif ici est juste de détecter un écart entre niveau écrit et niveau oral, pas de noter la prononciation précisément
- Résultat : un profil à deux dimensions (niveau de compréhension/grammaire CECRL + niveau de fluidité orale CECRL), stocké et réutilisé pour calibrer tout le contenu généré par l'IA ensuite

**Pourquoi deux dimensions séparées** : c'est un point de différenciation important par rapport aux apps qui donnent un seul niveau global — beaucoup d'apprenants ont un écart entre compréhension et expression, et le confondre dans un seul score fausse la calibration des leçons.

**Important** : le scoring de prononciation fin (Azure Pronunciation Assessment, par phonème) n'intervient pas dans ce test initial — il est réservé au module de progression continue (Fonctionnalité 2, conversation vocale) où il sert à détecter les sons récurrents problématiques dans la durée. Le test de placement reste volontairement léger sur ce point pour rester rapide à passer et peu coûteux en API.

Le test doit pouvoir être repassé volontairement (recalibrage) et l'app doit aussi ajuster le niveau en continu de façon implicite via les sessions (si l'utilisateur réussit trop facilement les exercices générés, glisser doucement le niveau vers le haut sans repasser le test complet).

**Capture des intérêts précis pendant l'onboarding** : au-delà du choix du thème (musique/voyage/business), capter 2-3 informations précises (quel genre de musique/artiste préféré, quelle destination de voyage en tête, quel secteur d'activité) pour que la toute première leçon générée après le test soit déjà fortement personnalisée — effet "wahou" dès la première session, important pour la rétention initiale.

### Fonctionnalité de progression — système central, pas un module annexe

La progression ne doit pas être un dashboard cosmétique mais le moteur qui pilote la difficulté du contenu généré à chaque session.

**Modèle de progression** :
- Niveau CECRL double (écrit/oral) mis à jour en continu, comme décrit ci-dessus
- Courbe de maîtrise par compétence : vocabulaire (mots en répétition espacée + mots maîtrisés), prononciation (sons spécifiques travaillés et leur taux de réussite dans le temps), fluidité conversationnelle (longueur moyenne des réponses, temps de pause, taux de correction nécessaire par l'IA)
- Chaque génération de contenu IA (leçon, exercice, prompt de conversation) doit recevoir en paramètre le profil de progression actuel de l'utilisateur pour adapter automatiquement la difficulté du vocabulaire injecté et la complexité grammaticale attendue

**Affichage utilisateur** : dashboard honnête plutôt que gamifié à outrance (cohérent avec ce qu'on avait posé) — progression par compétence visible sous forme de courbe simple, pas de système de points artificiels déconnectés de la réalité du niveau.

### Fonctionnalité 2 : mode conversation vocale avec coach de prononciation

**Système de personas IA** : pas un seul "prof IA" générique mais une persona différente par thème, avec personnalité et ton propres — un guide décontracté et chaleureux pour le voyage, une persona plus carrée et professionnelle pour le business, etc. Implémentation : un objet `Persona` (nom, ton, system_prompt_fragment, voice_id) associé à chaque thème, injecté dans le prompt de conversation et dans le choix de voix TTS. Coût d'implémentation faible mais gain perçu important en richesse d'expérience.

C'est le cœur différenciant de l'app — pas un chat texte, un vrai échange à l'oral avec correction de prononciation, l'objectif étant de se rapprocher d'un accent natif.

**Boucle d'interaction** :
1. L'utilisateur parle (micro, Web Audio API)
2. Speech-to-text avec timestamps + score de confiance par mot (Whisper API, qui donne de bons logprobs)
3. **Analyse phonétique séparée** de l'analyse sémantique : il faut détecter non seulement "qu'est-ce qu'il a dit" mais "comment il l'a prononcé". Pour ça, deux approches possibles à évaluer ensemble :
   - Comparer la transcription Whisper à ce qui était attendu phonétiquement (détection d'erreurs si Whisper "corrige" silencieusement une mauvaise prononciation — signal indirect mais imparfait)
   - Utiliser une API dédiée à l'évaluation de prononciation (Azure Speech "Pronunciation Assessment" est la plus mature du marché pour avoir un score par phonème/mot avec détail accuracy/fluency/prosody) — je veux qu'on évalue cette option sérieusement plutôt que de bricoler avec Whisper seul
4. Réponse de l'IA (Claude) en tant que persona "natif" qui poursuit la conversation naturellement sur le thème choisi
5. Synthèse vocale de la réponse (TTS — ElevenLabs ou alternative à comparer en coût) avec **replay illimité au clic sur n'importe quel mot ou phrase** de la conversation, dans le panneau de transcript — point sur lequel les concurrents type Learna AI échouent souvent (impossible de réécouter)
6. Feedback de prononciation affiché discrètement (pas de pop-up qui casse l'immersion) : mots mal prononcés surlignés avec le son correct rejouable au clic

**Principe de correction** : ne pas interrompre le flow conversationnel pour corriger chaque erreur (ça décourage et casse l'oral). La correction phonétique est visuelle/asynchrone pendant que la conversation continue, tandis que les corrections de grammaire/vocabulaire peuvent être glissées naturellement dans la réponse de l'IA.

**Fin de session** : résumé avec deux volets distincts — points de prononciation à travailler (sons spécifiques récurrents, ex: "th", voyelles longues) et points de langue (grammaire/vocabulaire), 3 items max par catégorie pour rester actionnable.

**Exercices ciblés de prononciation** : à partir des erreurs récurrentes détectées sur plusieurs sessions, génération d'exercices de répétition ciblés (paires de mots, virelangues adaptés) sur les sons spécifiquement problématiques pour cet utilisateur — c'est ce qui doit donner de vrais résultats par rapport aux apps existantes qui ne personnalisent pas la correction phonétique.

### Fonctionnalité 3 : suivi de progression — vue dashboard

(Le moteur de progression est décrit en détail dans la Fonctionnalité 0 ci-dessus, cette section couvre uniquement la restitution visuelle)

- Dashboard simple : mots appris cette semaine, mots à réviser aujourd'hui (algorithme de répétition espacée type SM-2 simplifié), nombre de sessions, évolution du niveau CECRL double (écrit/oral) dans le temps
- Pas de gamification artificielle (pas de streak agressif ni de cœurs/vies) — focus sur des métriques honnêtes de progression réelle

## Schéma de données Supabase (à créer)

Tables nécessaires : users (gérée par Supabase Auth), user_profile (id, user_id, written_cefr_level, spoken_fluency_cefr_level, last_calibrated_at, interests_json — intérêts précis capturés à l'onboarding), placement_test_results (id, user_id, test_type [written/oral], score_detail_json, resulting_cefr_level, taken_at), themes (id, slug, nom, description — pré-rempli avec musique/voyage/business mais seul musique actif), personas (id, theme_id, name, tone_description, system_prompt_fragment, voice_id — une persona par thème), lessons (id, user_id, theme_id, source_content, generated_at, type, target_cefr_level), vocabulary_items (id, user_id, word, translation, context_sentence, difficulty, lesson_id), review_schedule (id, vocabulary_item_id, next_review_date, ease_factor, interval_days, last_reviewed_at — logique SM-2), conversation_sessions (id, user_id, theme_id, persona_id, started_at, summary, mistakes_summary, audio_duration_seconds), pronunciation_errors (id, session_id, user_id, phoneme_or_sound, word, accuracy_score, occurred_at — issu du scoring Azure en continu pendant les sessions de conversation, pour suivre les sons récurrents problématiques dans le temps et générer les exercices ciblés), pronunciation_exercises (id, user_id, target_sound, exercise_content, generated_at, completed).

Demande-moi de valider ce schéma avant de générer les migrations SQL — je veux comprendre chaque relation avant de l'appliquer.

## Architecture des prompts IA (point critique)

Je veux que les prompts envoyés à l'API Claude soient dans des fichiers séparés (`/lib/prompts/`), pas hardcodés dans les composants, pour pouvoir les itérer facilement. Chaque prompt doit :
- Forcer une sortie JSON structurée et strictement typée (avec un schéma TypeScript correspondant)
- Inclure des contraintes de niveau (CECRL) basées sur le profil utilisateur
- Avoir un système de fallback propre en cas d'erreur de parsing JSON

## Contraintes importantes

- **Propriété intellectuelle** : ne jamais stocker ou afficher les paroles complètes de chansons commerciales de façon permanente/publique. L'utilisateur colle son propre texte pour un usage personnel d'analyse pédagogique — le stockage en base doit rester privé à l'utilisateur (pas de bibliothèque partagée de paroles entre utilisateurs).
- Code commenté en français dans la logique métier, en anglais pour les noms de variables/fonctions (convention standard)
- Architecture pensée multi-thèmes dès le départ (interfaces génériques, pas de code spécifique "musique" en dur dans la logique partagée)
- Pas de dépendance lourde inutile — rester proche du vanilla Next.js/Tailwind
- **Mode debug pédagogique** : un toggle dev (variable d'environnement, désactivé par défaut) qui affiche les prompts bruts envoyés à Claude et les réponses JSON brutes reçues, accessible uniquement en local pour itérer rapidement sur la qualité de génération sans repasser par Cursor à chaque ajustement. À retirer ou sécuriser avant toute mise en production commerciale.

## Roadmap V2 (à ne pas développer maintenant, mais à garder en tête dans l'architecture)

- **Objectif daté** : connecter les sessions à un objectif concret avec échéance (ex: date de départ en voyage) pour structurer le contenu en compte à rebours et créer une urgence naturelle sans gamification artificielle
- **Karaoké de prononciation** : chanter par-dessus une chanson et scorer la prononciation en rythme (alignement audio/texte en temps réel) — fort potentiel différenciant sur le module musique mais complexité technique élevée, à ne pas adresser avant que le scoring de prononciation conversationnel soit stable

## Ce que je veux que tu fasses maintenant

1. Propose-moi l'arborescence de fichiers du projet (structure App Router, dossier lib, components, etc.)
2. Génère le schéma SQL Supabase complet avec les migrations
3. Crée le premier prompt IA (`/lib/prompts/analyze-lyrics.ts`) pour l'analyse de paroles avec son typage TypeScript de sortie
4. Construis la page principale du module Paroles (upload texte → affichage résultats) avec un design original, pas un template Tailwind par défaut
5. Avant de coder le module vocal : compare-moi concrètement Azure Speech Pronunciation Assessment vs une approche bricolée avec Whisper seul (coûts, complexité d'intégration, qualité du scoring par phonème) pour qu'on tranche ensemble avant d'engager du temps de dev dessus

Pose-moi des questions si un point est ambigu avant de générer du code à grande échelle.
