"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute({ children }) {
  const { user, loading, isAuthenticated, init } = useAuthStore();
  const router = useRouter();

  // Initialize auth on component mount
  useEffect(() => {
    const subscription = init();
    return () => {
      subscription?.then((sub) => sub?.unsubscribe());
    };
  }, [init]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
}
