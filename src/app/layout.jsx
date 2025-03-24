"use client";

import { Toaster } from "sonner";
import { NavMenu } from "@/components/Nav";
import "./globals.css";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({ children }) {
  const { init } = useAuthStore();

  useEffect(() => {
    // Initialize auth
    const subscription = init();

    // Track tab visibility state
    let wasHidden = false;

    // Simple handler that reloads the page when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
      } else if (wasHidden && document.visibilityState === "visible") {
        console.log("Tab became visible after being hidden - reloading page");
        // Add a small delay to ensure browser is ready
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
    };

    // Add event listener
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Cleanup
    return () => {
      subscription?.then((sub) => sub?.unsubscribe());
      if (typeof window !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      }
    };
  }, [init]);

  return (
    <html lang="es">
      <body>
        <TooltipProvider>
          <NavMenu />
          <main>{children}</main>
          <Toaster position="top-center" richColors expand closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
