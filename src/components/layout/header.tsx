
"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { LogOut, Settings, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar"; // From shadcn/ui

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return "CR"; // EngageSphere initials or a generic fallback
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
      <div className="md:hidden"> {/* For mobile sidebar toggle */}
         <SidebarTrigger />
      </div>
      <div className="flex-1">
        {/* Optionally, add a search bar or breadcrumbs here */}
        {/* <h1 className="text-lg font-semibold">EngageSphere</h1> */}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={user.image || ''} alt={user.name || "User"} data-ai-hint="profile picture" />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile" passHref legacyBehavior>
                <DropdownMenuItem asChild>
                  <a>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </a>
                </DropdownMenuItem>
              </Link>
              <Link href="/settings" passHref legacyBehavior>
                 <DropdownMenuItem asChild>
                    <a>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </a>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

