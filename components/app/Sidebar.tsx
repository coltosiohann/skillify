"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  User,
  X,
  BarChart2,
  Bookmark,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

const navMain = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { href: "/courses",      icon: BookOpen,        label: "My Courses" },
  { href: "/onboarding",   icon: PlusCircle,      label: "New Course", badge: "AI" },
];

const navProgress = [
  { href: "/leaderboard",  icon: BarChart2,       label: "Leaderboard" },
  { href: "/achievements", icon: Trophy,          label: "Achievements" },
  { href: "/bookmarks",    icon: Bookmark,        label: "Bookmarks" },
];

const navAccount = [
  { href: "/notifications", icon: Bell,    label: "Notifications" },
  { href: "/profile",       icon: User,    label: "Profile" },
  { href: "/settings",      icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.altKey) return;
      if (e.key === "d" || e.key === "D") { e.preventDefault(); router.push("/dashboard"); }
      if (e.key === "c" || e.key === "C") { e.preventDefault(); router.push("/courses"); }
      if (e.key === "n" || e.key === "N") { e.preventDefault(); router.push("/onboarding"); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleNavClick() {
    setMobileOpen(false);
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  function NavGroup({ items, label }: { items: typeof navMain; label?: string }) {
    return (
      <div>
        {label && !collapsed && (
          <div
            className="px-3 pt-5 pb-1 text-[10px] font-bold tracking-[0.08em] uppercase"
            style={{ color: "var(--tx3)" }}
          >
            {label}
          </div>
        )}
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}>
              <div
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer mb-0.5 relative",
                  active
                    ? "nav-active"
                    : "text-sidebar-foreground hover:bg-[var(--hover)]"
                )}
                style={active ? {} : { color: "var(--tx2)" }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {(!collapsed || mobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {"badge" in item && item.badge && (!collapsed || mobileOpen) && (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "var(--blue)" }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-[18px] flex-shrink-0 border-b"
        style={{ height: "56px", borderColor: "var(--border)" }}
      >
        <div
          className="flex-shrink-0 w-[30px] h-[30px] rounded-[9px] flex items-center justify-center font-bold text-[15px] text-white"
          style={{ background: "var(--blue)", fontFamily: "var(--fd)" }}
        >
          S
        </div>
        <AnimatePresence>
          {(!collapsed || mobileOpen) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18 }}
              className="font-heading font-bold text-base whitespace-nowrap overflow-hidden"
            >
              Skillify
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close menu"
          style={{ color: "var(--tx3)" }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-2.5 py-3 flex flex-col overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "none" }}
        data-tour="sidebar-nav"
      >
        <NavGroup items={navMain} />
        <NavGroup items={navProgress} label="Progress" />
        <NavGroup items={navAccount} label="Account" />
      </nav>

      {/* Sign out */}
      <div className="px-2.5 py-3 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer"
          style={{ color: "var(--tx3)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "oklch(0.65 0.18 10 / 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--tx3)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {(!collapsed || mobileOpen) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 220 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative flex-shrink-0 h-screen flex-col z-30 hidden md:flex border-r"
        style={{
          background: "var(--sidebar)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        {sidebarContent}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer z-10 border"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--tx3)",
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-50 md:hidden border-r"
              style={{
                background: "var(--sidebar)",
                borderColor: "var(--sidebar-border)",
              }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
