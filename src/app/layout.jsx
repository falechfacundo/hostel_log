import { Toaster } from "sonner";
import { NavMenu } from "@/components/Nav";
import { TabVisibilityHandler } from "@/components/TabVisibilityHandler";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <TabVisibilityHandler />
        <TooltipProvider>
          <NavMenu />
          <main>{children}</main>
          <Toaster position="top-center" richColors expand closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
