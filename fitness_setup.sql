-- SQL Schema Script for Fitness & Body Metrics Module

-- 1. Activity Types Catalog Table
CREATE TABLE IF NOT EXISTS public.activity_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default activity types if empty
INSERT INTO public.activity_types (name, slug, icon, category) VALUES
('Strength Training', 'strength_training', 'Dumbbell', 'strength'),
('Badminton', 'badminton', 'Activity', 'sports'),
('Swimming', 'swimming', 'Waves', 'cardio'),
('Running', 'running', 'Timer', 'cardio'),
('Walking', 'walking', 'Footprints', 'cardio'),
('Yoga', 'yoga', 'Sparkles', 'flexibility')
ON CONFLICT (slug) DO NOTHING;

-- 2. Fitness Activities Table (Actual logs)
CREATE TABLE IF NOT EXISTS public.fitness_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    activity_type_id UUID REFERENCES public.activity_types(id) ON DELETE RESTRICT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    distance NUMERIC(6,2),
    calories INTEGER,
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    steps INTEGER,
    intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')) DEFAULT 'medium' NOT NULL,
    notes TEXT,
    photos TEXT[], -- Array of photo URL links
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Fitness Weekly Routines Header Table
CREATE TABLE IF NOT EXISTS public.fitness_routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, week_start)
);

-- 4. Routine Planned Items Table
CREATE TABLE IF NOT EXISTS public.routine_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES public.fitness_routines(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    activity_type_id UUID REFERENCES public.activity_types(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    duration_minutes INTEGER DEFAULT 30 NOT NULL,
    notes TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    completed_activity_id UUID REFERENCES public.fitness_activities(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Strength Workout Plans Table
CREATE TABLE IF NOT EXISTS public.strength_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Strength Plan Exercises Table
CREATE TABLE IF NOT EXISTS public.strength_plan_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID REFERENCES public.strength_plans(id) ON DELETE CASCADE NOT NULL,
    exercise_name TEXT NOT NULL,
    muscle_group TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    target_sets INTEGER DEFAULT 3 NOT NULL,
    target_reps INTEGER DEFAULT 10 NOT NULL,
    target_weight NUMERIC(5,2), -- in kg
    rest_seconds INTEGER DEFAULT 60 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Strength Sessions Table (Completed workouts)
CREATE TABLE IF NOT EXISTS public.strength_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.strength_plans(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Strength Session Sets Details Table
CREATE TABLE IF NOT EXISTS public.strength_session_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.strength_sessions(id) ON DELETE CASCADE NOT NULL,
    exercise_name TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight NUMERIC(5,2) NOT NULL, -- in kg
    rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Body Measurements Table (Extensible metrics catalog)
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type TEXT NOT NULL, -- 'weight', 'BMI', 'body_fat', 'muscle_mass', 'water', 'bone_mass', 'visceral_fat', 'BMR' etc.
    value NUMERIC(6,2) NOT NULL,
    unit TEXT,
    source TEXT DEFAULT 'manual' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.fitness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_session_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies (Ensure users can only access their own records)

-- fitness_activities RLS
CREATE POLICY "Users can manage their own activities" 
    ON public.fitness_activities FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- fitness_routines RLS
CREATE POLICY "Users can manage their own fitness routines" 
    ON public.fitness_routines FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- routine_items RLS
CREATE POLICY "Users can manage their own routine items" 
    ON public.routine_items FOR ALL 
    USING (auth.uid() = (SELECT user_id FROM public.fitness_routines WHERE id = routine_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.fitness_routines WHERE id = routine_id));

-- strength_plans RLS
CREATE POLICY "Users can manage their own strength plans" 
    ON public.strength_plans FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- strength_plan_exercises RLS
CREATE POLICY "Users can manage their own strength exercises" 
    ON public.strength_plan_exercises FOR ALL 
    USING (auth.uid() = (SELECT user_id FROM public.strength_plans WHERE id = plan_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.strength_plans WHERE id = plan_id));

-- strength_sessions RLS
CREATE POLICY "Users can manage their own strength sessions" 
    ON public.strength_sessions FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- strength_session_sets RLS
CREATE POLICY "Users can manage their own strength sets" 
    ON public.strength_session_sets FOR ALL 
    USING (auth.uid() = (SELECT user_id FROM public.strength_sessions WHERE id = session_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.strength_sessions WHERE id = session_id));

-- body_measurements RLS
CREATE POLICY "Users can manage their own body measurements" 
    ON public.body_measurements FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Triggers for auto updated_at columns
CREATE OR REPLACE TRIGGER update_fitness_activities_updated_at
    BEFORE UPDATE ON public.fitness_activities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_fitness_routines_updated_at
    BEFORE UPDATE ON public.fitness_routines
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_routine_items_updated_at
    BEFORE UPDATE ON public.routine_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_strength_plans_updated_at
    BEFORE UPDATE ON public.strength_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_strength_plan_exercises_updated_at
    BEFORE UPDATE ON public.strength_plan_exercises
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create Optimization Indices
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.fitness_activities(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_routines_user_week ON public.fitness_routines(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_routine_items_routine ON public.routine_items(routine_id);
CREATE INDEX IF NOT EXISTS idx_strength_exercises_plan ON public.strength_plan_exercises(plan_id);
CREATE INDEX IF NOT EXISTS idx_strength_sessions_user ON public.strength_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_session_sets_session ON public.strength_session_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_metric ON public.body_measurements(user_id, metric_type, recorded_at);
