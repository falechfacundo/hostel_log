"use client";

import { Toaster } from "sonner";
import { NavMenu } from "@/components/Nav";
import "./globals.css";
import { Providers } from "./providers";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout({ children }) {
  // Initialize auth once at the root level
  const { init } = useAuthStore();

  useEffect(() => {
    const subscription = init();
    return () => {
      subscription?.then((sub) => sub?.unsubscribe());
    };
  }, [init]);

  return (
    <html lang="es">
      <body>
        <Providers>
          <NavMenu />
          <main>{children}</main>
          <Toaster position="top-center" richColors expand closeButton />
        </Providers>
      </body>
    </html>
  );
}
