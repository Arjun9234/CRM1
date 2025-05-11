
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavLinks } from "./nav-links";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react"; 
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"; // Using the provided shadcn sidebar components

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg text-primary hover:text-accent transition-colors">
          <Brain className="h-7 w-7" />
          <span className="group-data-[collapsible=icon]:hidden">EngageSphere</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavLinks.map((link) => {
            const isActive = link.match ? link.match(pathname) : pathname.startsWith(link.href);
            return (
              <SidebarMenuItem key={link.href}>
                <Link href={link.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={{ children: link.label, className: "bg-card text-card-foreground border-border"}}
                    className={cn(
                        "justify-start",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                  >
                    <a>
                      <link.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t p-2">
        {/* Can add user profile quick actions here if needed */}
        {/* For example, a settings button:
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" legacyBehavior passHref>
              <SidebarMenuButton asChild tooltip={{ children: "Settings" }}>
                <a><Settings className="h-5 w-5" /><span className="group-data-[collapsible=icon]:hidden">Settings</span></a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        */}
      </SidebarFooter>
    </Sidebar>
  );
}
