import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME_MS = 2 * 60 * 1000; // Show warning 2 minutes before logout

export function useSessionTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningShownRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if session has expired on mount (page reload/reopen)
    checkSessionValidity();

    function resetTimeouts() {
      lastActivityRef.current = Date.now();
      isWarningShownRef.current = false;

      // Clear existing timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

      // Set warning timeout (28 minutes)
      warningTimeoutRef.current = setTimeout(() => {
        if (!isWarningShownRef.current) {
          isWarningShownRef.current = true;
          showSessionWarning();
        }
      }, SESSION_TIMEOUT_MS - WARNING_TIME_MS);

      // Set logout timeout (30 minutes)
      timeoutRef.current = setTimeout(() => {
        handleSessionTimeout();
      }, SESSION_TIMEOUT_MS);
    }

    function showSessionWarning() {
      // Store that user saw the warning
      localStorage.setItem("sessionWarningShown", "true");

      // Show native browser alert
      const shouldContinue = confirm(
        "Your session is about to expire in 2 minutes due to inactivity. Click OK to stay logged in."
      );

      if (shouldContinue) {
        resetTimeouts();
      } else {
        handleSessionTimeout();
      }
    }

    async function handleSessionTimeout() {
      // Clear session
      await fetch("/api/admin/auth/logout", { method: "POST" });

      // Redirect to login
      router.push("/admin/login?expired=true");
    }

    async function checkSessionValidity() {
      try {
        const res = await fetch("/api/admin/auth/session", { method: "GET" });
        if (!res.ok) {
          // Session expired or invalid
          await fetch("/api/admin/auth/logout", { method: "POST" });
          router.push("/admin/login?expired=true");
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    }

    // Track user activity
    function handleActivity() {
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        // Only reset if more than 1 second has passed
        resetTimeouts();
      }
    }

    // Add event listeners for user activity
    const events = ["mousedown", "keydown", "touchstart", "click"];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timeout setup
    resetTimeouts();

    return () => {
      // Cleanup
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [router]);
}
