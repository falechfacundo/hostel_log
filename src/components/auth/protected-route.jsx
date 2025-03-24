"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute({ children }) {
  const { user, loading, isAuthenticated, init, refreshSession } =
    useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Initialize auth on component mount
  useEffect(() => {
    let subscription;

    const initializeAuth = async () => {
      try {
        subscription = await init();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        // If initialization fails, try to refresh the session
        try {
          await refreshSession();
        } catch (refreshError) {
          console.error("Failed to refresh session:", refreshError);
          router.push("/login");
        }
      }
    };

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [init, refreshSession, router]);

  // Check authentication after initialization is complete
  useEffect(() => {
    if (isInitialized && !loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router, isInitialized]);

  // Show nothing during loading or if not authenticated
  if (loading || !isAuthenticated) {
    return null;
  }

  return children;
}
