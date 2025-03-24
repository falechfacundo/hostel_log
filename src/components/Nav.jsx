"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Building2, LayoutDashboard, Users, LogOut } from "lucide-react";

import { PartnerSelector } from "@/components/PartnerSelector";
import { LogoutButton } from "@/components/auth/logout-button";

import { useAuthStore } from "@/store/authStore";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["editor", "admin"],
  },
  { name: "Albergues", href: "/albergues", icon: Building2, roles: ["admin"] },
  { name: "Viajeros", href: "/viajeros", icon: Users, roles: ["admin"] },
];

export function NavMenu() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userProfile = useAuthStore((state) => state.userProfile);
  const pathname = usePathname();

  return (
    <header>
      <nav className="flex justify-between items-center px-8 py-4 bg-white/50 backdrop-blur-sm border-b">
        <div className="flex items-center gap-8">
          {/* Navigation Links */}
          <div className="flex space-x-4">
            {isAuthenticated &&
              navigation.map((item) => {
                const Icon = item.icon;
                if (
                  userProfile?.role &&
                  item.roles.includes(userProfile.role)
                ) {
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                        pathname === item.href
                          ? "bg-fuchsia-pink-500 text-white"
                          : "hover:bg-fuchsia-pink-100"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                }
                return null;
              })}
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Logout Button */}
          {isAuthenticated && <LogoutButton variant="ghost" size="md" />}
          {/* Logo */}
          <Link href="/login" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={60}
              height={60}
              className="object-contain w-auto"
            />
          </Link>
        </div>
      </nav>
      <PartnerSelector />
    </header>
  );
}
