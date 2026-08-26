-- SQL Migration Script for New Fitness Routine & Body Metrics System

-- 1. Modify public.fitness_routines
ALTER TABLE public.fitness_routines DROP CONSTRAINT IF EXISTS fitness_routines_user_id_week_start_key;
ALTER TABLE public.fitness_routines ALTER COLUMN week_start DROP NOT NULL;

ALTER TABLE public.fitness_routines ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.fitness_routines ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.fitness_routines ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.fitness_routines ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.fitness_routines ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'active', 'archived')) DEFAULT 'draft';
ALTER TABLE public.fitness_routines ADD COLUMN IF NOT EXISTS source_routine_id UUID REFERENCES public.fitness_routines(id) ON DELETE SET NULL;

-- Migrate existing weekly routines to the new structure
UPDATE public.fitness_routines
SET 
  name = COALESCE(name, 'Weekly Routine - ' || week_start::text),
  start_date = COALESCE(start_date, week_start),
  end_date = COALESCE(end_date, week_start + INTERVAL '6 days'),
  status = COALESCE(status, 'archived')
WHERE week_start IS NOT NULL;

-- 2. Create fitness_routine_days
CREATE TABLE IF NOT EXISTS public.fitness_routine_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES public.fitness_routines(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    workout_type TEXT, -- e.g. 'Strength Training', 'Rest Day', 'Yoga'
    body_part TEXT, -- e.g. 'Chest', 'Back', 'Legs'
    is_rest_day BOOLEAN DEFAULT false NOT NULL,
    warmup_type TEXT CHECK (warmup_type IN ('common', 'custom', 'both', 'none')) DEFAULT 'common' NOT NULL,
    warmup_notes TEXT,
    stretching_type TEXT CHECK (stretching_type IN ('common', 'custom', 'both', 'none')) DEFAULT 'common' NOT NULL,
    stretching_notes TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(routine_id, day_of_week)
);

-- Migrate existing routine_items to fitness_routine_days
INSERT INTO public.fitness_routine_days (routine_id, day_of_week, workout_type, body_part, is_rest_day)
SELECT DISTINCT routine_id, day_of_week, 'Strength Training', 'Full Body', false
FROM public.routine_items
ON CONFLICT (routine_id, day_of_week) DO NOTHING;

-- 3. Create fitness_routine_exercises
CREATE TABLE IF NOT EXISTS public.fitness_routine_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_day_id UUID REFERENCES public.fitness_routine_days(id) ON DELETE CASCADE NOT NULL,
    exercise_name TEXT NOT NULL,
    exercise_id TEXT, -- optional link to exercise catalog
    order_index INTEGER DEFAULT 0 NOT NULL,
    sets INTEGER DEFAULT 3 NOT NULL,
    reps_min INTEGER DEFAULT 8 NOT NULL,
    reps_max INTEGER DEFAULT 12 NOT NULL,
    weight NUMERIC(5,2), -- optional weight in kg
    duration_seconds INTEGER, -- optional duration
    rest_seconds INTEGER DEFAULT 60 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create fitness_workout_sessions (what actually happened)
CREATE TABLE IF NOT EXISTS public.fitness_workout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    routine_id UUID REFERENCES public.fitness_routines(id) ON DELETE SET NULL,
    routine_day_id UUID REFERENCES public.fitness_routine_days(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('started', 'completed', 'cancelled')) DEFAULT 'completed' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrate existing strength_sessions to fitness_workout_sessions
INSERT INTO public.fitness_workout_sessions (id, user_id, started_at, completed_at, notes, created_at)
SELECT id, user_id, started_at, completed_at, notes, created_at
FROM public.strength_sessions
ON CONFLICT (id) DO NOTHING;

-- 5. Create fitness_workout_sets
CREATE TABLE IF NOT EXISTS public.fitness_workout_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_session_id UUID REFERENCES public.fitness_workout_sessions(id) ON DELETE CASCADE NOT NULL,
    routine_exercise_id UUID REFERENCES public.fitness_routine_exercises(id) ON DELETE SET NULL,
    exercise_name TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    planned_reps INTEGER,
    actual_reps INTEGER NOT NULL,
    weight NUMERIC(5,2) NOT NULL, -- in kg
    completed BOOLEAN DEFAULT true NOT NULL,
    notes TEXT
);

-- Migrate existing strength_session_sets to fitness_workout_sets
INSERT INTO public.fitness_workout_sets (workout_session_id, exercise_name, set_number, actual_reps, weight, notes)
SELECT session_id, exercise_name, set_number, reps, weight, notes
FROM public.strength_session_sets;

-- 6. Create fitness_routine_notifications
CREATE TABLE IF NOT EXISTS public.fitness_routine_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES public.fitness_routines(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL, -- e.g. 'routine_ending'
    scheduled_for DATE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(routine_id, notification_type)
);

-- Enable RLS on new tables
ALTER TABLE public.fitness_routine_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_routine_notifications ENABLE ROW LEVEL SECURITY;

-- Setup RLS policies
CREATE POLICY "Users can manage their own routine days" ON public.fitness_routine_days
    FOR ALL USING (auth.uid() = (SELECT user_id FROM public.fitness_routines WHERE id = routine_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.fitness_routines WHERE id = routine_id));

CREATE POLICY "Users can manage their own routine exercises" ON public.fitness_routine_exercises
    FOR ALL USING (auth.uid() = (SELECT r.user_id FROM public.fitness_routines r JOIN public.fitness_routine_days d ON d.routine_id = r.id WHERE d.id = routine_day_id))
    WITH CHECK (auth.uid() = (SELECT r.user_id FROM public.fitness_routines r JOIN public.fitness_routine_days d ON d.routine_id = r.id WHERE d.id = routine_day_id));

CREATE POLICY "Users can manage their own workout sessions" ON public.fitness_workout_sessions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workout sets" ON public.fitness_workout_sets
    FOR ALL USING (auth.uid() = (SELECT user_id FROM public.fitness_workout_sessions WHERE id = workout_session_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.fitness_workout_sessions WHERE id = workout_session_id));

CREATE POLICY "Users can manage their own routine notifications" ON public.fitness_routine_notifications
    FOR ALL USING (auth.uid() = (SELECT user_id FROM public.fitness_routines WHERE id = routine_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.fitness_routines WHERE id = routine_id));
