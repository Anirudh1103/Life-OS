-- Setup script for Life-OS Finance Module

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Finance Categories Table
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('expense', 'income', 'all')) DEFAULT 'expense' NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Finance Accounts Table
CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('bank', 'savings', 'cash', 'credit_card', 'wallet', 'investment', 'loan', 'other')) NOT NULL,
    institution TEXT,
    currency TEXT DEFAULT 'INR' NOT NULL,
    opening_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    current_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    credit_limit DECIMAL(15,2),
    billing_cycle_day INTEGER,
    payment_due_day INTEGER,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Finance Shared Spaces (Shared budget spaces)
CREATE TABLE IF NOT EXISTS public.finance_shared_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Finance Shared Members Table
CREATE TABLE IF NOT EXISTS public.finance_shared_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.finance_shared_spaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (space_id, user_id)
);

-- 5. Finance Transactions Table
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.finance_accounts(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('expense', 'income', 'transfer')) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    merchant TEXT,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    transaction_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    description TEXT,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    transfer_group_id UUID, -- For linking both sides of a transfer transaction
    shared_space_id UUID REFERENCES public.finance_shared_spaces(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Finance Tags Table
CREATE TABLE IF NOT EXISTS public.finance_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, name)
);

-- 7. Finance Transaction Tags Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.finance_transaction_tags (
    transaction_id UUID REFERENCES public.finance_transactions(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.finance_tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (transaction_id, tag_id)
);

-- 8. Finance Budgets Table
CREATE TABLE IF NOT EXISTS public.finance_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE CASCADE, -- NULL means overall budget
    name TEXT NOT NULL,
    period_type TEXT CHECK (period_type IN ('weekly', 'monthly', 'custom')) DEFAULT 'monthly' NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    carryover_enabled BOOLEAN DEFAULT false NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Finance Goals Table
CREATE TABLE IF NOT EXISTS public.finance_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    target_date TIMESTAMPTZ NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Finance Subscriptions Table (Bills & Subscriptions)
CREATE TABLE IF NOT EXISTS public.finance_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'every_2_weeks', 'monthly', 'every_4_weeks', 'quarterly', 'yearly', 'custom')) DEFAULT 'monthly' NOT NULL,
    next_payment TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('active', 'paused', 'cancelled')) DEFAULT 'active' NOT NULL,
    start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_date TIMESTAMPTZ,
    cancelled_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Finance Expense Splits Table (For shared expenses)
CREATE TABLE IF NOT EXISTS public.finance_expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.finance_transactions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    owed_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Finance Settlements Table
CREATE TABLE IF NOT EXISTS public.finance_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.finance_shared_spaces(id) ON DELETE CASCADE NOT NULL,
    payer_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    payee_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    settled_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT
);

-- Enable Row-Level Security (RLS) on all tables
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_shared_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_shared_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settlements ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies (Users can only access their own data, except for shared spaces)

-- Categories RLS
CREATE POLICY "Users can do all on their own categories" ON public.finance_categories
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Accounts RLS
CREATE POLICY "Users can do all on their own accounts" ON public.finance_accounts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shared Spaces RLS
CREATE POLICY "Users can view shared spaces they are member of" ON public.finance_shared_spaces
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        EXISTS (SELECT 1 FROM public.finance_shared_members WHERE space_id = id AND user_id = auth.uid())
    );

CREATE POLICY "Owners can perform all actions on shared spaces" ON public.finance_shared_spaces
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Shared Members RLS
CREATE POLICY "Members can view space memberships" ON public.finance_shared_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.finance_shared_spaces WHERE id = space_id AND owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.finance_shared_members m WHERE m.space_id = space_id AND m.user_id = auth.uid())
    );

CREATE POLICY "Owners/Admins can manage memberships" ON public.finance_shared_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.finance_shared_spaces WHERE id = space_id AND owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.finance_shared_members WHERE space_id = space_id AND user_id = auth.uid() AND role = 'admin')
    );

-- Transactions RLS
CREATE POLICY "Users can manage their own transactions" ON public.finance_transactions
    FOR ALL USING (
        auth.uid() = user_id OR
        (shared_space_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.finance_shared_members WHERE space_id = shared_space_id AND user_id = auth.uid()
        ))
    );

-- Tags RLS
CREATE POLICY "Users can manage their own tags" ON public.finance_tags
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transaction Tags RLS
CREATE POLICY "Users can manage transaction tags" ON public.finance_transaction_tags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.finance_transactions WHERE id = transaction_id AND user_id = auth.uid())
    );

-- Budgets RLS
CREATE POLICY "Users can manage their own budgets" ON public.finance_budgets
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goals RLS
CREATE POLICY "Users can manage their own goals" ON public.finance_goals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Subscriptions RLS
CREATE POLICY "Users can manage their own subscriptions" ON public.finance_subscriptions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Expense Splits RLS
CREATE POLICY "Members can view splits" ON public.finance_expense_splits
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.finance_transactions WHERE id = transaction_id AND user_id = auth.uid())
    );

CREATE POLICY "Transaction owner can manage splits" ON public.finance_expense_splits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.finance_transactions WHERE id = transaction_id AND user_id = auth.uid())
    );

-- Settlements RLS
CREATE POLICY "Members can view settlements" ON public.finance_settlements
    FOR SELECT USING (
        payer_id = auth.uid() OR payee_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.finance_shared_members WHERE space_id = space_id AND user_id = auth.uid())
    );

CREATE POLICY "Members can log settlements" ON public.finance_settlements
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.finance_shared_members WHERE space_id = space_id AND user_id = auth.uid())
    );

-- Trigger functions for auto updated_at columns
CREATE OR REPLACE TRIGGER update_finance_categories_updated_at
    BEFORE UPDATE ON public.finance_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_finance_accounts_updated_at
    BEFORE UPDATE ON public.finance_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_finance_shared_spaces_updated_at
    BEFORE UPDATE ON public.finance_shared_spaces
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_finance_transactions_updated_at
    BEFORE UPDATE ON public.finance_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_finance_budgets_updated_at
    BEFORE UPDATE ON public.finance_budgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_finance_goals_updated_at
    BEFORE UPDATE ON public.finance_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_finance_subscriptions_updated_at
    BEFORE UPDATE ON public.finance_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_finance_categories_user ON public.finance_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_user ON public.finance_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date ON public.finance_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_account ON public.finance_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_user ON public.finance_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_goals_user ON public.finance_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_subscriptions_user_date ON public.finance_subscriptions(user_id, next_payment);
