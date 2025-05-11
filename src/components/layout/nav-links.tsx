
import { LayoutDashboard, Users, PlusCircle, Settings, LogOut, BarChart3, ListChecks } from "lucide-react";
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
    match: (pathname) => pathname === "/dashboard" || (pathname.startsWith("/campaigns") && !pathname.startsWith("/campaigns/new")),
  },
  {
    href: "/campaigns/new",
    label: "Create Campaign",
    icon: PlusCircle,
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: ListChecks,
  },
  // Example for more links:
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
