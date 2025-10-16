import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Handles authentication errors by signing out and redirecting to login
 */
export const handleAuthError = async (error: any, customMessage?: string) => {
  console.error("Auth error:", error);
  
  // Check if it's a session error
  const isSessionError = 
    error?.message?.includes("session") ||
    error?.message?.includes("JWT") ||
    error?.message?.includes("auth") ||
    error?.code === "PGRST301" ||
    error?.status === 403;

  if (isSessionError) {
    toast.error(customMessage || "Your session has expired. Please sign in again.");
    
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error("Error signing out:", signOutError);
    }
    
    // Redirect to auth page
    window.location.href = "/auth";
    return true;
  }
  
  return false;
};

/**
 * Wraps a query function with automatic session recovery
 */
export const withAuthRecovery = async <T>(
  queryFn: () => Promise<T>,
  errorMessage?: string
): Promise<T> => {
  try {
    // First check if user session is valid
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      await handleAuthError(authError || new Error("No user session"), errorMessage);
      throw new Error("Authentication required");
    }
    
    return await queryFn();
  } catch (error: any) {
    const wasAuthError = await handleAuthError(error, errorMessage);
    if (!wasAuthError) {
      // Re-throw if it wasn't an auth error
      throw error;
    }
    throw new Error("Authentication required");
  }
};
