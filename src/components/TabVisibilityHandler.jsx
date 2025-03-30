"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function TabVisibilityHandler({ excludedRoutes = ["/viajeros/new"] }) {
  const { init } = useAuthStore();
  const pathname = usePathname();

  // Check if current route should be excluded
  const isExcludedRoute = excludedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    // Initialize auth on first render
    const subscription = init();

    // If this is an excluded route, don't add the visibility handler
    if (isExcludedRoute) {
      console.log(`Tab visibility reload disabled for route: ${pathname}`);
      return () => {
        subscription?.then((sub) => sub?.unsubscribe());
      };
    }

    // Regular behavior for non-excluded routes
    let wasHidden = false;

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

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription?.then((sub) => sub?.unsubscribe());
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [init, isExcludedRoute, pathname]);

  return null;
}
