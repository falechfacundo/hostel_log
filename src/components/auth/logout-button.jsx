"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export function LogoutButton({ variant = "outline", size = "sm" }) {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useAuthStore();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          <span>Cerrar sesión</span>
        </>
      )}
    </Button>
  );
}
