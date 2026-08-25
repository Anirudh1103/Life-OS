-- SQL Schema Script for Tasks & Flow Tracker Module

-- 1. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    workspace TEXT CHECK (workspace IN ('personal', 'work')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    is_important BOOLEAN DEFAULT false NOT NULL,
    is_in_today BOOLEAN DEFAULT false NOT NULL,
    priority TEXT CHECK (priority IN ('none', 'low', 'medium', 'high')) DEFAULT 'none' NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE,
    reminder_at TIMESTAMP WITH TIME ZONE,
    recurrence_rule TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Task Steps (Subtasks) Table
CREATE TABLE IF NOT EXISTS public.task_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Task Files Table
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Task Flows Table
CREATE TABLE IF NOT EXISTS public.task_flows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    current_stage_id UUID, -- Will be set after stages are populated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Task Flow Stages Table
CREATE TABLE IF NOT EXISTS public.task_flow_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID REFERENCES public.task_flows(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reference constraint from task_flows to stages
ALTER TABLE public.task_flows 
ADD CONSTRAINT fk_task_flows_current_stage 
FOREIGN KEY (current_stage_id) REFERENCES public.task_flow_stages(id) ON DELETE SET NULL;

-- 6. Create Task Flow History (Transitions) Table
CREATE TABLE IF NOT EXISTS public.task_flow_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID REFERENCES public.task_flows(id) ON DELETE CASCADE NOT NULL,
    from_stage_id UUID REFERENCES public.task_flow_stages(id) ON DELETE SET NULL,
    to_stage_id UUID REFERENCES public.task_flow_stages(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_flow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_flow_history ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies (Ensure users can only access their own records)

-- tasks RLS
CREATE POLICY "Users can manage their own tasks" 
    ON public.tasks FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- task_steps RLS
CREATE POLICY "Users can manage their own task steps" 
    ON public.task_steps FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- task_files RLS
CREATE POLICY "Users can manage their own task files" 
    ON public.task_files FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- task_flows RLS
CREATE POLICY "Users can manage their own task flows" 
    ON public.task_flows FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- task_flow_stages RLS
CREATE POLICY "Users can manage their own task flow stages" 
    ON public.task_flow_stages FOR ALL 
    USING (auth.uid() = (SELECT user_id FROM public.task_flows WHERE id = flow_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.task_flows WHERE id = flow_id));

-- task_flow_history RLS
CREATE POLICY "Users can manage their own task flow history" 
    ON public.task_flow_history FOR ALL 
    USING (auth.uid() = (SELECT user_id FROM public.task_flows WHERE id = flow_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.task_flows WHERE id = flow_id));

-- Triggers for auto updated_at columns
CREATE OR REPLACE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_task_steps_updated_at
    BEFORE UPDATE ON public.task_steps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_task_flows_updated_at
    BEFORE UPDATE ON public.task_flows
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_task_flow_stages_updated_at
    BEFORE UPDATE ON public.task_flow_stages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create Optimization Indices
CREATE INDEX IF NOT EXISTS idx_tasks_user_workspace ON public.tasks(user_id, workspace);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON public.tasks(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_task_steps_task ON public.task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_task ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_flows_task ON public.task_flows(task_id);
CREATE INDEX IF NOT EXISTS idx_task_flow_stages_flow ON public.task_flow_stages(flow_id);

-- ========================================================
-- STORAGE BUCKET CONFIGURATION
-- ========================================================

-- Insert storage bucket configuration
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task_attachments', 'task_attachments', false) 
ON CONFLICT (id) DO NOTHING;

-- RLS Policies on storage.objects for 'task_attachments' bucket
-- Authenticated users can upload to folder named after their UID
CREATE POLICY "Allow authenticated users to upload files to task_attachments" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'task_attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can read files in folder named after their UID
CREATE POLICY "Allow authenticated users to read files from task_attachments" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'task_attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can delete files in folder named after their UID
CREATE POLICY "Allow authenticated users to delete files from task_attachments" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'task_attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
