-- Add missing RLS policies for better security and usability

-- 1. Allow users to leave challenges they joined
CREATE POLICY "Users can leave challenges" ON public.challenge_participants
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 2. Allow challenge creators to remove participants
CREATE POLICY "Challenge creators can remove participants" ON public.challenge_participants
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM challenges 
      WHERE id = challenge_participants.challenge_id 
      AND creator_id = auth.uid()
    )
  );

-- 3. Allow group creators to remove members
CREATE POLICY "Group creators can remove members" ON public.expense_group_members
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM expense_groups 
      WHERE id = expense_group_members.group_id 
      AND created_by = auth.uid()
    )
  );

-- 4. Allow users to remove themselves from groups
CREATE POLICY "Users can leave expense groups" ON public.expense_group_members
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Allow expense creators or group admins to remove expense members
CREATE POLICY "Expense creators can remove expense members" ON public.expense_members
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_members.expense_id 
      AND (e.user_id = auth.uid() OR e.paid_by = auth.uid())
    )
  );

-- 6. Allow group creators to remove expense members
CREATE POLICY "Group creators can remove expense members" ON public.expense_members
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN expense_groups g ON g.id = e.group_id
      WHERE e.id = expense_members.expense_id 
      AND g.created_by = auth.uid()
    )
  );

-- 7. Allow users to delete their own focus sessions
CREATE POLICY "Users can delete their own focus sessions" ON public.focus_sessions
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 8. Allow users to update/delete their habit check-ins (within 24 hours)
CREATE POLICY "Users can update their recent check-ins" ON public.habit_check_ins
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    AND checked_in_at > now() - interval '24 hours'
  );

CREATE POLICY "Users can delete their recent check-ins" ON public.habit_check_ins
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    AND checked_in_at > now() - interval '24 hours'
  );

-- 9. Allow users to manage their challenge progress history
CREATE POLICY "Users can update their progress history" ON public.challenge_progress_history
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their progress history" ON public.challenge_progress_history
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 10. Allow notification creation only by system (service role)
-- This prevents users from creating fake notifications
-- Only the create_notification function (security definer) can insert
CREATE POLICY "Only system can create notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (false);  -- No user can insert directly

-- 11. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_check_ins_user_habit ON public.habit_check_ins(user_id, habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_check_ins_date ON public.habit_check_ins(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_challenges_creator ON public.challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_members_expense ON public.expense_members(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_members_user ON public.expense_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_group_members_group ON public.expense_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_group_members_user ON public.expense_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_resource ON public.invitations(resource_id, invite_type);