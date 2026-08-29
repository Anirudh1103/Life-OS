-- SQL Schema Script for Calendar Events Module

-- 1. Create Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('MEETING', 'EVENT', 'BIRTHDAY', 'ANNIVERSARY', 'REMINDER', 'PERSONAL', 'WORK')) NOT NULL,
    date DATE NOT NULL,
    start_time TEXT, -- format HH:mm
    end_time TEXT,   -- format HH:mm
    is_all_day BOOLEAN DEFAULT false NOT NULL,
    location TEXT,
    meeting_url TEXT,
    recurrence TEXT CHECK (recurrence IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')) DEFAULT 'NONE' NOT NULL,
    reminder_minutes INTEGER,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- 3. Setup RLS Policies (Ensure users can only access their own records)
CREATE POLICY "Users can manage their own calendar events" 
    ON public.calendar_events FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Triggers for auto updated_at columns
CREATE OR REPLACE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create Optimization Indices
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON public.calendar_events(user_id, date);
