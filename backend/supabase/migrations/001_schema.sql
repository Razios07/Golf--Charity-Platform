-- ================================================================
-- Golf Charity Platform — Full Database Schema
-- Paste this entire file into the Supabase SQL Editor and run it.
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES (extends auth.users) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber','admin')),
  handicap    INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  plan                    TEXT NOT NULL CHECK (plan IN ('monthly','yearly')),
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','cancelled','lapsed','trialing')),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  amount                  NUMERIC(10,2) NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── CHARITIES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.charities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  description      TEXT,
  image_url        TEXT,
  website          TEXT,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  upcoming_events  JSONB DEFAULT '[]',
  total_raised     NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── USER CHARITY SELECTIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_charities (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id           UUID NOT NULL REFERENCES public.charities(id),
  contribution_percent INTEGER NOT NULL DEFAULT 10 CHECK (contribution_percent >= 10 AND contribution_percent <= 100),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── GOLF SCORES (rolling 5 per user, Stableford 1–45) ─────────────────
CREATE TABLE IF NOT EXISTS public.golf_scores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at  DATE NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: keep only the latest 5 scores per user (FIFO)
CREATE OR REPLACE FUNCTION enforce_rolling_scores()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.golf_scores
  WHERE id IN (
    SELECT id FROM public.golf_scores
    WHERE user_id = NEW.user_id
    ORDER BY played_at DESC, created_at DESC
    OFFSET 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rolling_scores ON public.golf_scores;
CREATE TRIGGER trg_rolling_scores
  AFTER INSERT ON public.golf_scores
  FOR EACH ROW EXECUTE FUNCTION enforce_rolling_scores();

-- ── PRIZE POOLS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prize_pools (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month               TEXT NOT NULL UNIQUE,  -- "2025-07"
  total_pool          NUMERIC(10,2) NOT NULL DEFAULT 0,
  jackpot_pool        NUMERIC(10,2) NOT NULL DEFAULT 0,  -- 40%
  match4_pool         NUMERIC(10,2) NOT NULL DEFAULT 0,  -- 35%
  match3_pool         NUMERIC(10,2) NOT NULL DEFAULT 0,  -- 25%
  jackpot_carried     NUMERIC(10,2) NOT NULL DEFAULT 0,  -- rolled over from previous month
  active_subscribers  INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DRAWS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.draws (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month            TEXT NOT NULL UNIQUE,
  draw_type        TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random','algorithmic')),
  winning_numbers  INTEGER[] NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','simulated','published')),
  jackpot_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  pool_4match      NUMERIC(10,2) NOT NULL DEFAULT 0,
  pool_3match      NUMERIC(10,2) NOT NULL DEFAULT 0,
  jackpot_rollover BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DRAW ENTRIES (snapshot of scores at draw time) ────────────────────
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id      UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scores       INTEGER[] NOT NULL,
  match_count  INTEGER,
  prize_amount NUMERIC(10,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- ── WINNERS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.winners (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id              UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_type           TEXT NOT NULL CHECK (match_type IN ('5-match','4-match','3-match')),
  prize_amount         NUMERIC(10,2) NOT NULL,
  proof_url            TEXT,
  verification_status  TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  payment_status       TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid')),
  admin_notes          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CHARITY DONATIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.charity_donations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id       UUID NOT NULL REFERENCES public.charities(id),
  amount           NUMERIC(10,2) NOT NULL,
  month            TEXT NOT NULL,
  subscription_id  UUID REFERENCES public.subscriptions(id),
  type             TEXT NOT NULL DEFAULT 'subscription' CHECK (type IN ('subscription','independent')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_charities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pools       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_donations ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users read own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles"   ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Subscriptions
CREATE POLICY "Users read own sub"  ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage subs"  ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Charities (public read)
CREATE POLICY "Public read charities"    ON public.charities FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage charities"  ON public.charities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- User charities
CREATE POLICY "Users manage own charity" ON public.user_charities FOR ALL USING (user_id = auth.uid());

-- Scores
CREATE POLICY "Users manage own scores"  ON public.golf_scores FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins manage all scores" ON public.golf_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Prize pools
CREATE POLICY "Auth users read pools"    ON public.prize_pools FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage pools"      ON public.prize_pools FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Draws
CREATE POLICY "Auth users read published draws" ON public.draws FOR SELECT USING (
  auth.uid() IS NOT NULL AND status = 'published');
CREATE POLICY "Admins manage draws"      ON public.draws FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Draw entries
CREATE POLICY "Users read own entries"   ON public.draw_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage entries"    ON public.draw_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Winners
CREATE POLICY "Users read own wins"      ON public.winners FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users upload proof"       ON public.winners FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins manage winners"    ON public.winners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Charity donations
CREATE POLICY "Users read own donations" ON public.charity_donations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins read all donations" ON public.charity_donations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- SEED CHARITIES
-- ================================================================
INSERT INTO public.charities (name, description, image_url, website, is_featured, upcoming_events) VALUES
('Green Fairways Foundation',
 'Supporting youth golf development and environmental conservation through sustainable course management.',
 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
 'https://greenfairways.org', TRUE,
 '[{"title":"Junior Golf Day","date":"2025-08-15","location":"Royal Golf Club, London"}]'),
('Cancer Research UK Golf Committee',
 'Raising vital funds for cancer research through the golfing community. Every putt counts towards a cure.',
 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
 'https://cancerresearchuk.org', TRUE,
 '[{"title":"Charity Golf Day","date":"2025-09-20","location":"Wentworth Club, Surrey"}]'),
('Golf in Society',
 'Using golf to combat loneliness and improve mental wellbeing for elderly and isolated communities.',
 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
 'https://golfinsociety.org', FALSE, '[]'),
('Birdies for Children',
 'Every birdie translates into meals, books, and support for underprivileged children worldwide.',
 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800',
 'https://birdiesforchildren.org', FALSE,
 '[{"title":"Annual Tournament","date":"2025-10-05","location":"St Andrews, Scotland"}]')
ON CONFLICT DO NOTHING;
