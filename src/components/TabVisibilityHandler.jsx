"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function TabVisibilityHandler() {
  const { init } = useAuthStore();

  useEffect(() => {
    // Initialize auth on first render
    const subscription = init();

    // Track tab visibility state
    let wasHidden = false;

    // Handler that reloads the page when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
      } else if (wasHidden && document.visibilityState === "visible") {
        console.log("Tab became visible - reloading page");
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
    };

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      subscription?.then((sub) => sub?.unsubscribe());
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [init]);

  // This component doesn't render anything
  return null;
}
