import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Security headers with CSRF protection
export const securityHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential XSS characters
    .substring(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  if (!email) return "";
  const trimmed = email.trim().toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : "";
};

// Rate limiting check
interface RateLimitConfig {
  action: string;
  maxRequests: number;
  windowMinutes: number;
}

export const checkRateLimit = async (
  userId: string,
  config: RateLimitConfig,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<{ allowed: boolean; remaining: number }> => {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  // Count recent requests
  const { data: recentLimits, error: countError } = await supabase
    .from("rate_limits")
    .select("count")
    .eq("user_id", userId)
    .eq("action", config.action)
    .gte("window_start", windowStart.toISOString());

  if (countError) {
    console.error("Rate limit check error:", countError);
    return { allowed: true, remaining: config.maxRequests }; // Fail open
  }

  const totalCount = (recentLimits || []).reduce((sum, r) => sum + (r.count || 0), 0);

  if (totalCount >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Record this request
  const currentWindow = new Date();
  currentWindow.setMinutes(Math.floor(currentWindow.getMinutes() / 5) * 5, 0, 0); // 5-min windows

  await supabase.from("rate_limits").upsert(
    {
      user_id: userId,
      action: config.action,
      window_start: currentWindow.toISOString(),
      count: 1,
    },
    {
      onConflict: "user_id,action,window_start",
      ignoreDuplicates: false,
    }
  );

  return { allowed: true, remaining: config.maxRequests - totalCount - 1 };
};

// Validate origin (CSRF protection)
export const validateOrigin = (req: Request): boolean => {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "https://splitz.live",
    "https://www.splitz.live",
  ];
  
  if (!origin) return true; // Allow requests without origin (e.g., server-to-server)
  
  // Allow Lovable preview domains
  if (origin.includes('.lovableproject.com')) return true;
  
  return allowedOrigins.some(allowed => origin.startsWith(allowed));
};
