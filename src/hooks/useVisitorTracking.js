import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const useVisitorTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        await supabase.from("page_views").insert([
          { 
            path: location.pathname + location.search,
            user_agent: navigator.userAgent 
          }
        ]);
      } catch (error) {
        console.error("Tracking error:", error);
      }
    };

    // Delay tracking slightly so it doesn't block page rendering
    const timeoutId = setTimeout(trackVisit, 500);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]);
};

export default useVisitorTracking;