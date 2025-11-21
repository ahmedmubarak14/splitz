import { supabase } from "@/integrations/supabase/client";

export const logActivity = async (
  activityType: string,
  activityData: Record<string, any> = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_activity")
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData,
      });

    if (error) {
      console.error("Error logging activity:", error);
    }
  } catch (error) {
    console.error("Error in logActivity:", error);
  }
};

// Specific activity loggers
export const activityLoggers = {
  habitCheckIn: (habitName: string, streak: number) =>
    logActivity("habit_checkin", { habit_name: habitName, streak }),

  challengeJoined: (challengeName: string) =>
    logActivity("challenge_joined", { challenge_name: challengeName }),

  expenseAdded: (expenseName: string, amount: number) =>
    logActivity("expense_added", { expense_name: expenseName, amount }),

  focusCompleted: (duration: number, survived: boolean) =>
    logActivity("focus_completed", { duration, survived }),

  streakMilestone: (habitName: string, streak: number) =>
    logActivity("streak_milestone", { 
      habit_name: habitName, 
      streak,
      is_milestone: true 
    }),

  challengeCompleted: (challengeName: string) =>
    logActivity("challenge_completed", { 
      challenge_name: challengeName,
      is_milestone: true 
    }),
};
