-- Performance Optimization: Add database indexes for frequently queried columns
-- Only for tables that exist in the schema

-- Habits indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

-- Habit check-ins indexes
CREATE INDEX IF NOT EXISTS idx_habit_check_ins_user_habit ON habit_check_ins(user_id, habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_check_ins_habit_date ON habit_check_ins(habit_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_habit_check_ins_date ON habit_check_ins(checked_in_at DESC);

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_creator ON challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges(end_date DESC);

-- Challenge participants indexes  
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);

-- Challenge progress history indexes
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON challenge_progress_history(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress_history(challenge_id);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);

-- Expense group members indexes
CREATE INDEX IF NOT EXISTS idx_expense_group_members_user ON expense_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_group_members_group ON expense_group_members(group_id);

-- Expense members indexes
CREATE INDEX IF NOT EXISTS idx_expense_members_user ON expense_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_members_expense ON expense_members(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_members_settled ON expense_members(user_id, is_settled);

-- Net balances indexes
CREATE INDEX IF NOT EXISTS idx_net_balances_from_user ON net_balances(from_user_id);
CREATE INDEX IF NOT EXISTS idx_net_balances_to_user ON net_balances(to_user_id);
CREATE INDEX IF NOT EXISTS idx_net_balances_group ON net_balances(group_id);

-- Expense groups indexes
CREATE INDEX IF NOT EXISTS idx_expense_groups_creator ON expense_groups(created_by);

-- Focus sessions indexes
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_completed ON focus_sessions(user_id, end_time DESC) WHERE end_time IS NOT NULL;

-- Focus tasks indexes
CREATE INDEX IF NOT EXISTS idx_focus_tasks_user ON focus_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_tasks_user_due ON focus_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_focus_tasks_completed ON focus_tasks(user_id, is_completed);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON subscriptions(user_id, next_renewal_date);

-- Profiles index for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);