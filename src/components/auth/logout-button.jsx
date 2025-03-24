"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function LogoutButton({ variant = "outline", size = "sm" }) {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      // Redirect to login after logout
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error al cerrar sesión. Inténtelo de nuevo.");
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
