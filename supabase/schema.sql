-- ============================================================
-- DETEKTIF COWY -- Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE rank_type AS ENUM (
  'cadet_investigator',
  'field_detective',
  'senior_detective',
  'detective_sergeant',
  'detective_lieutenant',
  'chief_inspector'
);

CREATE TYPE difficulty_type AS ENUM ('easy', 'medium', 'hard', 'leader');
CREATE TYPE case_status_type AS ENUM ('draft', 'active', 'inactive');
CREATE TYPE room_status_type AS ENUM ('waiting', 'in_progress', 'finished');
CREATE TYPE ability_type AS ENUM (
  'forensik', 'profiler', 'hacker', 'interogator',
  'kriminolog', 'ahli_lapangan', 'jurnalis', 'pengacara'
);

-- ============================================================
-- USERS / PROFILES
-- ============================================================

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  bio             TEXT,
  rank            rank_type NOT NULL DEFAULT 'cadet_investigator',
  total_xp        INTEGER NOT NULL DEFAULT 0,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update rank based on XP
CREATE OR REPLACE FUNCTION public.update_rank()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rank := CASE
    WHEN NEW.total_xp >= 10000 THEN 'chief_inspector'::rank_type
    WHEN NEW.total_xp >= 6000  THEN 'detective_lieutenant'::rank_type
    WHEN NEW.total_xp >= 3000  THEN 'detective_sergeant'::rank_type
    WHEN NEW.total_xp >= 1500  THEN 'senior_detective'::rank_type
    WHEN NEW.total_xp >= 500   THEN 'field_detective'::rank_type
    ELSE 'cadet_investigator'::rank_type
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_xp_update
  BEFORE UPDATE OF total_xp ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_rank();

-- ============================================================
-- BADGES
-- ============================================================

CREATE TABLE public.badges (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  icon             TEXT NOT NULL DEFAULT 'military_tech',
  condition_type   TEXT NOT NULL,
  condition_value  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_badges (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Seed default badges
INSERT INTO public.badges (name, description, icon, condition_type, condition_value) VALUES
  ('Solo Survivor',     'Selesaikan case saat rekan tim disconnect',             'person',         'solo_finish',      '1'),
  ('First Blood',       'Menangkan case pertama kamu',                           'swords',         'first_win',        '1'),
  ('Speed Demon',       'Selesaikan case dalam waktu kurang dari 10 menit',      'bolt',           'speed_win_mins',   '10'),
  ('Puzzle Master',     'Selesaikan Benang Merah board dengan sempurna',         'extension',      'puzzle_complete',  '1'),
  ('No Mercy',          'Selesaikan case tanpa salah tuduh',                     'gavel',          'perfect_accuse',   '1'),
  ('Veteran',           'Selesaikan 10 case',                                    'shield',         'total_wins',       '10'),
  ('Chief Material',    'Capai rank Chief Inspector',                            'star',           'rank_reached',     'chief_inspector'),
  ('Team Player',       'Menangkan 5 case multiplayer',                          'groups',         'multi_wins',       '5');

-- ============================================================
-- CASES
-- ============================================================

CREATE TABLE public.cases (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  difficulty    difficulty_type NOT NULL DEFAULT 'easy',
  region        TEXT NOT NULL DEFAULT 'Jakarta',
  description   TEXT NOT NULL DEFAULT '',
  status        case_status_type NOT NULL DEFAULT 'draft',
  play_count    INTEGER NOT NULL DEFAULT 0,
  like_count    INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  content_json  JSONB,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROOMS
-- ============================================================

CREATE TABLE public.rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code   TEXT UNIQUE NOT NULL,
  size        SMALLINT NOT NULL CHECK (size IN (2, 3, 4)),
  status      room_status_type NOT NULL DEFAULT 'waiting',
  case_id     UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  host_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.room_players (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id        UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  abilities      ability_type[] NOT NULL DEFAULT '{}',
  score          INTEGER NOT NULL DEFAULT 0,
  is_connected   BOOLEAN NOT NULL DEFAULT TRUE,
  disconnect_at  TIMESTAMPTZ,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Generate unique 4-char room code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 4));
    SELECT EXISTS(SELECT 1 FROM public.rooms WHERE room_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- GAME RESULTS
-- ============================================================

CREATE TABLE public.game_results (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id          UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  case_id          UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  is_win           BOOLEAN NOT NULL DEFAULT FALSE,
  culprit_id       TEXT NOT NULL,
  accused_id       TEXT,
  base_score       INTEGER NOT NULL DEFAULT 0,
  speed_bonus      INTEGER NOT NULL DEFAULT 0,
  puzzle_bonus     INTEGER NOT NULL DEFAULT 0,
  penalty          INTEGER NOT NULL DEFAULT 0,
  total_score      INTEGER NOT NULL DEFAULT 0,
  xp_earned        INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  finished_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ACCUSATIONS
-- ============================================================

CREATE TABLE public.accusations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  suspect_id   TEXT NOT NULL,
  reason       TEXT,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TES AKSES (Hard/Leader access test)
-- ============================================================

CREATE TABLE public.tes_akses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id      UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  attempt      SMALLINT NOT NULL DEFAULT 1 CHECK (attempt BETWEEN 1 AND 3),
  passed       BOOLEAN NOT NULL DEFAULT FALSE,
  failed_at    TIMESTAMPTZ,
  cooldown_until TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, case_id)
);

-- ============================================================
-- NOTEBOOK & BENANG MERAH
-- ============================================================

CREATE TABLE public.notebook_entries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('clue', 'quote', 'note', 'photo')),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  source_id  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.board_nodes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('clue', 'suspect', 'witness', 'note')),
  label      TEXT NOT NULL,
  x          FLOAT NOT NULL DEFAULT 0,
  y          FLOAT NOT NULL DEFAULT 0,
  source_id  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.board_connections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES public.board_nodes(id) ON DELETE CASCADE,
  to_node_id   UUID NOT NULL REFERENCES public.board_nodes(id) ON DELETE CASCADE,
  label        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_node_id, to_node_id)
);

-- ============================================================
-- AI GENERATOR CONFIG
-- ============================================================

CREATE TABLE public.ai_generator_config (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  config      JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- ROOM CHAT
-- ============================================================

CREATE TABLE public.room_chat (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UNBLOCK REQUESTS
-- ============================================================

CREATE TABLE public.unblock_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accusations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tes_akses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unblock_requests ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- BADGES
CREATE POLICY "Badges viewable by everyone"
  ON public.badges FOR SELECT USING (true);

-- USER BADGES
CREATE POLICY "User badges viewable by everyone"
  ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can insert user badges"
  ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CASES
CREATE POLICY "Active cases viewable by authenticated users"
  ON public.cases FOR SELECT USING (
    status = 'active' OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Only admins can insert cases"
  ON public.cases FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Only admins can update cases"
  ON public.cases FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Only admins can delete cases"
  ON public.cases FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ROOMS
CREATE POLICY "Rooms viewable by authenticated users"
  ON public.rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update room"
  ON public.rooms FOR UPDATE USING (auth.uid() = host_id);

-- ROOM PLAYERS
CREATE POLICY "Room players viewable by authenticated users"
  ON public.room_players FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can join rooms"
  ON public.room_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own player record"
  ON public.room_players FOR UPDATE USING (auth.uid() = user_id);

-- GAME RESULTS
CREATE POLICY "Game results viewable by authenticated users"
  ON public.game_results FOR SELECT USING (auth.uid() IS NOT NULL);

-- ACCUSATIONS
CREATE POLICY "Accusations viewable by room players"
  ON public.accusations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Players can submit accusations"
  ON public.accusations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TES AKSES
CREATE POLICY "Users can view own tes akses"
  ON public.tes_akses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tes akses"
  ON public.tes_akses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tes akses"
  ON public.tes_akses FOR UPDATE USING (auth.uid() = user_id);

-- NOTEBOOK
CREATE POLICY "Users can view own notebook"
  ON public.notebook_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notebook"
  ON public.notebook_entries FOR ALL USING (auth.uid() = user_id);

-- BOARD NODES (shared per room)
CREATE POLICY "Room players can view board nodes"
  ON public.board_nodes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Room players can insert board nodes"
  ON public.board_nodes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Room players can update board nodes"
  ON public.board_nodes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Room players can delete board nodes"
  ON public.board_nodes FOR DELETE USING (auth.uid() IS NOT NULL);

-- BOARD CONNECTIONS (shared per room)
CREATE POLICY "Room players can view board connections"
  ON public.board_connections FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Room players can manage board connections"
  ON public.board_connections FOR ALL USING (auth.uid() IS NOT NULL);

-- UNBLOCK REQUESTS
CREATE POLICY "Users can view own unblock requests"
  ON public.unblock_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit unblock requests"
  ON public.unblock_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all unblock requests"
  ON public.unblock_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can update unblock requests"
  ON public.unblock_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- AI GENERATOR CONFIG
ALTER TABLE public.ai_generator_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI config"
  ON public.ai_generator_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI config"
  ON public.ai_generator_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI config"
  ON public.ai_generator_config FOR UPDATE USING (auth.uid() = user_id);

-- ROOM CHAT
ALTER TABLE public.room_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room players can view chat"
  ON public.room_chat FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Room players can send chat"
  ON public.room_chat FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accusations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_chat;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_rank ON public.profiles(total_xp DESC);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_difficulty ON public.cases(difficulty);
CREATE INDEX idx_cases_play_count ON public.cases(play_count DESC);
CREATE INDEX idx_rooms_code ON public.rooms(room_code);
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_room_players_room ON public.room_players(room_id);
CREATE INDEX idx_board_nodes_room ON public.board_nodes(room_id);
CREATE INDEX idx_board_connections_room ON public.board_connections(room_id);
CREATE INDEX idx_notebook_room_user ON public.notebook_entries(room_id, user_id);
CREATE INDEX idx_room_chat_room ON public.room_chat(room_id);
CREATE INDEX idx_ai_config_user ON public.ai_generator_config(user_id);
