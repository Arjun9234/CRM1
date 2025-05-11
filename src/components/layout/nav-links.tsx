
import { LayoutDashboard, Users, PlusCircle, Settings, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

export const mainNavLinks: NavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/dashboard" || pathname.startsWith("/campaigns") && !pathname.startsWith("/campaigns/new"),
  },
  {
    href: "/campaigns/new",
    label: "Create Campaign",
    icon: PlusCircle,
  },
  // Example for more links:
  // {
  //   href: "/segments",
  //   label: "Segments",
  //   icon: Users,
  // },
  // {
  //   href: "/settings",
  //   label: "Settings",
  //   icon: Settings,
  // },
];

export const userNavLinks = (logoutHandler: () => void): NavLink[] => [
 {
    href: "#", // Placeholder for profile or settings
    label: "Settings",
    icon: Settings,
  },
  {
    href: "/login", // actual logout will redirect
    label: "Logout",
    icon: LogOut,
  },
];