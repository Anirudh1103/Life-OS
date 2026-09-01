-- ====================================================================
-- LifeOS Health & Fitness Foundation Schema
-- Apple Health / Health Connect Ready Architecture
-- ====================================================================

-- 1. DAILY ACTIVITY (Aggregate table uniquely keyed by user_id + date)
CREATE TABLE IF NOT EXISTS public.daily_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    steps INTEGER DEFAULT 0 NOT NULL,
    distance_km NUMERIC(6,2) DEFAULT 0.00 NOT NULL,
    active_calories INTEGER DEFAULT 0 NOT NULL,
    total_calories INTEGER DEFAULT 0 NOT NULL,
    exercise_minutes INTEGER DEFAULT 0 NOT NULL,
    move_goal INTEGER DEFAULT 600,
    exercise_goal INTEGER DEFAULT 30,
    stand_goal INTEGER DEFAULT 12,
    move_completed BOOLEAN DEFAULT false NOT NULL,
    exercise_completed BOOLEAN DEFAULT false NOT NULL,
    stand_completed BOOLEAN DEFAULT false NOT NULL,
    source TEXT DEFAULT 'MANUAL' NOT NULL, -- 'APPLE_HEALTH', 'ANDROID_HEALTH_CONNECT', 'MANUAL', 'OTHER'
    source_id TEXT, -- External sample/aggregate identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- 2. WORKOUTS (Event-based with deduplication support)
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source TEXT DEFAULT 'MANUAL' NOT NULL, -- 'APPLE_HEALTH', 'ANDROID_HEALTH_CONNECT', 'MANUAL', 'OTHER'
    source_id TEXT, -- External workout UUID from Apple HealthKit / Health Connect
    workout_type TEXT NOT NULL, -- 'running', 'walking', 'cycling', 'strength_training', 'swimming', 'yoga', etc.
    title TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER NOT NULL,
    distance_km NUMERIC(6,2),
    active_calories INTEGER,
    total_calories INTEGER,
    average_heart_rate INTEGER,
    maximum_heart_rate INTEGER,
    elevation_gain_meters NUMERIC(6,2),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL, -- Future-proof: heart rate zones, route info, cadence, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deduplication unique index for externally sourced workouts
CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_user_source_id 
    ON public.workouts(user_id, source, source_id) 
    WHERE source_id IS NOT NULL;

-- 3. HEALTH & VITALS (Discrete health measurements with historical records)
CREATE TABLE IF NOT EXISTS public.health_vitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL, -- 'resting_heart_rate', 'heart_rate_variability', 'heart_rate', 'blood_pressure', 'oxygen_saturation', 'respiratory_rate', 'body_temperature', 'blood_glucose'
    value NUMERIC(8,2), -- Numeric value (e.g. 62 bpm, 48 ms, 98%)
    unit TEXT NOT NULL, -- 'bpm', 'ms', '%', 'mmHg', 'degC', 'mg/dL'
    systolic NUMERIC(5,1), -- Specific for blood pressure
    diastolic NUMERIC(5,1), -- Specific for blood pressure
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source TEXT DEFAULT 'MANUAL' NOT NULL, -- 'APPLE_HEALTH', 'ANDROID_HEALTH_CONNECT', 'MANUAL', 'OTHER'
    source_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deduplication index for vitals with external IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_health_vitals_user_source_id 
    ON public.health_vitals(user_id, source, source_id) 
    WHERE source_id IS NOT NULL;

-- 4. SLEEP SESSIONS (Sleep duration and stage breakdowns)
CREATE TABLE IF NOT EXISTS public.sleep_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source TEXT DEFAULT 'MANUAL' NOT NULL, -- 'APPLE_HEALTH', 'ANDROID_HEALTH_CONNECT', 'MANUAL', 'OTHER'
    source_id TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER NOT NULL,
    light_seconds INTEGER,
    deep_seconds INTEGER,
    rem_seconds INTEGER,
    awake_seconds INTEGER,
    sleep_score INTEGER, -- Optional 1-100 score if computed
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deduplication unique index for sleep sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_sleep_sessions_user_source_id 
    ON public.sleep_sessions(user_id, source, source_id) 
    WHERE source_id IS NOT NULL;

-- 5. BODY METRICS (Historical body composition tracking)
CREATE TABLE IF NOT EXISTS public.body_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL, -- 'weight', 'height', 'body_fat', 'lean_body_mass', 'basal_energy_burned', 'vo2_max', 'bmi'
    value NUMERIC(6,2) NOT NULL,
    unit TEXT NOT NULL, -- 'kg', 'cm', '%', 'kcal', 'mL/kg/min'
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source TEXT DEFAULT 'MANUAL' NOT NULL, -- 'APPLE_HEALTH', 'ANDROID_HEALTH_CONNECT', 'MANUAL', 'OTHER'
    source_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deduplication unique index for body metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_body_metrics_user_source_id 
    ON public.body_metrics(user_id, source, source_id) 
    WHERE source_id IS NOT NULL;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Each user can only access their own health records
-- ====================================================================

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

-- Daily Activity
CREATE POLICY "Users can view their own daily activity" 
    ON public.daily_activity FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activity" 
    ON public.daily_activity FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activity" 
    ON public.daily_activity FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily activity" 
    ON public.daily_activity FOR DELETE 
    USING (auth.uid() = user_id);

-- Workouts
CREATE POLICY "Users can view their own workouts" 
    ON public.workouts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" 
    ON public.workouts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
    ON public.workouts FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" 
    ON public.workouts FOR DELETE 
    USING (auth.uid() = user_id);

-- Health Vitals
CREATE POLICY "Users can view their own health vitals" 
    ON public.health_vitals FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health vitals" 
    ON public.health_vitals FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health vitals" 
    ON public.health_vitals FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health vitals" 
    ON public.health_vitals FOR DELETE 
    USING (auth.uid() = user_id);

-- Sleep Sessions
CREATE POLICY "Users can view their own sleep sessions" 
    ON public.sleep_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep sessions" 
    ON public.sleep_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep sessions" 
    ON public.sleep_sessions FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep sessions" 
    ON public.sleep_sessions FOR DELETE 
    USING (auth.uid() = user_id);

-- Body Metrics
CREATE POLICY "Users can view their own body metrics" 
    ON public.body_metrics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body metrics" 
    ON public.body_metrics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body metrics" 
    ON public.body_metrics FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body metrics" 
    ON public.body_metrics FOR DELETE 
    USING (auth.uid() = user_id);

-- ====================================================================
-- TRIGGERS & INDEXES
-- ====================================================================

CREATE OR REPLACE TRIGGER update_daily_activity_updated_at
    BEFORE UPDATE ON public.daily_activity
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_sleep_sessions_updated_at
    BEFORE UPDATE ON public.sleep_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_start ON public.workouts(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_health_vitals_user_metric_time ON public.health_vitals(user_id, metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_user_start ON public.sleep_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_metric_time ON public.body_metrics(user_id, metric_type, recorded_at DESC);
