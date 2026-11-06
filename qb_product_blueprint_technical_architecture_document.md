# QB Interactive Learning Kits — Product Blueprint & Technical Architecture Specification
*Inspired by educational gaming platforms like Academoo, designed for an independent, bilingual (Khmer/English), multi-audience learning ecosystem.*

---

## 1. Executive Summary & Product Vision
**QB Interactive Learning Kits** is a browser-based, child-friendly, teacher-empowered educational platform. Its foundational architecture centers on the **Universal Question Engine**: allowing educators, therapists, and curriculum creators to build or curate modular question sets once, and dynamically deploy them across an ever-expanding library of interactive web mini-games, classroom utilities, and home study missions.

### Key Differentiators:
1. **True Content Reusability:** 1 Question Set → N Games (Flashcards, Wheel Spin, Ship Battle, Alien Spelling, Crane Game, Potion Lab, etc.).
2. **First-Class Khmer & English Localization:** Full dual-language interface, Khmer script rendering, font pairing, phonetic audio integration, and curriculum alignment.
3. **Multi-Audience Portals:** Cohesive experiences for Teachers (authoring, assignments, live classroom tools), Students (gamified quests, avatars, badges), Parents (progress digest, homework sync), and Administrators.
4. **Modern Design System:** Neo-brutalist playful aesthetic with bold 2px ink navy outlines, friendly rounded radiuses (16–22px), vibrant pastel palettes, tactile button states, and cheerful brand mascot Leo the Lion/Fox.

---

## 2. Platform Architecture & Data Model

### A. Universal Content Engine
```
                  ┌─────────────────────────────────────────┐
                  │          Question Set Studio            │
                  │ (Text, Media, Phonetics, Question Types) │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Universal Question JSON         │
                  │ (Normalized schema, validation rules)   │
                  └────────────────────┬────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   Game Adapter   │          │   Game Adapter   │          │   Game Adapter   │
│   (Wheel Spin)   │          │  (Ship Battle)   │          │  (Flashcards)    │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

### B. Core Database Schema (PostgreSQL / Supabase)
- **`profiles`**: `id (UUID PK)`, `display_name`, `role ('teacher' | 'student' | 'parent' | 'admin')`, `preferred_language ('en' | 'km')`, `avatar_id`, `created_at`
- **`schools`**: `id (UUID PK)`, `name`, `settings (JSONB)`, `domain`
- **`classes`**: `id (UUID PK)`, `school_id (FK)`, `teacher_id (FK)`, `name`, `grade_level`, `join_code (VARCHAR 6)`
- **`class_members`**: `class_id (FK)`, `student_id (FK)`, `joined_at`
- **`question_sets`**: `id (UUID PK)`, `owner_id (FK)`, `title`, `description`, `subject`, `grade_level`, `language ('en' | 'km' | 'dual')`, `visibility ('private' | 'school' | 'public')`, `tags (text[])`
- **`questions`**: `id (UUID PK)`, `question_set_id (FK)`, `question_type ('multiple_choice' | 'true_false' | 'text' | 'image_id' | 'audio_listen' | 'spelling' | 'matching' | 'ordering')`, `prompt (JSONB)`, `answer_data (JSONB)`, `media (JSONB)`, `explanation (JSONB)`, `difficulty (1-5)`, `order_index (INT)`
- **`games`**: `id (UUID PK)`, `key_slug`, `title`, `supported_types (text[])`, `thumbnail_url`, `min_questions`, `max_players`
- **`assignments`**: `id (UUID PK)`, `teacher_id (FK)`, `class_id (FK)`, `question_set_id (FK)`, `game_id (FK)`, `due_at (TIMESTAMPTZ)`, `allow_retries (BOOL)`
- **`game_sessions`**: `id (UUID PK)`, `assignment_id (FK null-ok)`, `student_id (FK)`, `game_id (FK)`, `started_at`, `completed_at`, `score (INT)`, `stars_earned (INT)`, `status ('in_progress' | 'completed' | 'abandoned')`
- **`responses`**: `id (UUID PK)`, `session_id (FK)`, `question_id (FK)`, `response_data (JSONB)`, `is_correct (BOOL)`, `time_spent_ms (INT)`

---

## 3. Product Workspaces & Interface Blueprint

### 1. Public & Discovery Portal
- **Landing Page:** Interactive hero with Leo mascot, feature highlights, live interactive mini-demo, social proof, and pricing breakdown.
- **Explore Games & Content:** Curated catalog searchable by subject (Phonics, Math, Vocabulary, Khmer, STEM), grade, and play mode.
- **Pricing & Plans:**
  - *Free Explorer ($0):* Access to 6 standard games, 5 custom question sets, student single play.
  - *Teacher Pro ($4.99/mo or $34.99/yr):* Unlimited question sets, all 12+ games, student assignment tracking, classroom tools (Wheel, Timer, Grouper), audio recording, exportable reports.
  - *School Enterprise:* Organization dashboard, roster sync (Google Classroom / Clever), central billing, curriculum sharing.

### 2. Teacher Studio & Command Center
- **Question Studio:** Visual WYSIWYG editor supporting dual Khmer/English script, audio pronunciation recorders, drag-and-drop media, auto-generated distractors.
- **Game Launcher & Room Host:** Launch a live game room with 4-digit PIN for synchronous classroom challenges or create asynchronous homework assignments.
- **Classroom Utility Suite:**
  - *Name Wheel & Randomizer*
  - *Behavior Race & Star Chart*
  - *Classroom Visual Timer & Morning Check-in*
  - *Score Tracker & Group Generator*
- **Actionable Analytics:** Class-level mastery heatmaps, question discrimination index (identifying confusing questions), and student intervention flags.

### 3. Student Play & Learn Space
- **Child-Friendly Hub:** Clean visual navigation, high-contrast buttons, badge showcase, and avatar customization with earned star currency.
- **Adaptive Gameplay:** Tactile animations, celebratory micro-interactions, audio read-aloud support, and zero penalty failure states.
- **Offline / Low-Bandwidth Mode:** IndexedDB offline caching for student missions in low-connectivity areas with background sync upon reconnection.

### 4. Parent Portal
- **Home Learning Dashboard:** Weekly progress digests, phonics mastery summaries, and teacher-recommended 5-minute practice games.

---

## 4. Game Library Design Briefs

| Game Slug | Mechanic & Visual Metaphor | Supported Question Formats | Play Mode |
| :--- | :--- | :--- | :--- |
| **Wheel Spin** | Carnival wheel selection; configurable points and questions. | Multiple Choice, Open Question, Random Student | Live Class / Solo |
| **Ship Battle** | Naval strategy; correct answers fire cheerful splash cannon. | Multiple Choice, True/False, Quick Recall | Team / Solo |
| **Alien Spelling** | Space shuttle loading word blocks; phonics sound cues. | Spelling, Letter Arranging, Khmer Vowel Assembly | Solo Practice |
| **Crane Game** | Retro arcade claw grabs toy capsules upon correct answer. | Multiple Choice, Image Identification | Solo Practice |
| **Potion Lab** | Magical cauldron unlocks animal transformations & potions. | Matching, Ordering, Fill-in-Blank | Solo Practice |
| **Roll & Read** | Animated dice board game traversing island tiles. | Reading Comprehension, Phonics, Sight Words | 1–4 Players |
| **Flashcards 3D** | Tactile flip cards with self-assessment (Easy, Hard, Review). | Vocabulary, Audio Listen & Repeat, Dual Language | Revision Mode |

---

## 5. Implementation Roadmap

### Phase 1: Core Foundation & Design System (Weeks 1–4)
- Supabase Auth & Schema deployment with row-level security (RLS).
- Next.js 14 App Router, Tailwind CSS, and QB Interactive Learning Kits Design System integration.
- Responsive multi-device layout engine (Desktop, Tablet, Mobile).

### Phase 2: Universal Content Engine & Studio (Weeks 5–8)
- Question Set Studio with Khmer unicode support and audio recording uploads.
- Standardized Question-to-Game JSON runtime contract.
- First 3 core games: *Flashcards*, *Wheel Spin*, *Multiple Choice Quiz Challenge*.

### Phase 3: Classroom Management & Assignments (Weeks 9–12)
- Class creation, student PIN join codes, and assignment due dates.
- Teacher live scoreboard and analytics dashboard.
- Integrated classroom utilities (Timer, Star Chart, Grouper).

### Phase 4: Expanded Game Catalog & Gamification (Weeks 13–16)
- Development of *Alien Spelling*, *Crane Game*, and *Potion Lab*.
- Student avatar shop, star streaks, and animated badge reward unlocks.

### Phase 5: Parent Portal, Bilingual Expansion & Launch (Weeks 17–20)
- Parent digest portal and home practice recommendation engine.
- Khmer curriculum alignment pack and internationalized audio assets.
- Production security review, WCAG 2.2 AA accessibility audit, and beta rollout.
