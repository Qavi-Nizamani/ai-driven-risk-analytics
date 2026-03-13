"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Code2,
  KeyRound,
  FolderKanban,
  Building2,
  Zap,
  AlertTriangle,
  Radio,
  Package,
  Download,
  PlayCircle,
  FileCode2,
  Puzzle,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavSection {
  title: string;
  icon: React.ReactNode;
  basePath: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "REST API",
    icon: <Code2 className="w-4 h-4" />,
    basePath: "/rest-api",
    items: [
      { label: "Overview", href: "/rest-api", icon: <BookOpen className="w-3.5 h-3.5" /> },
      { label: "Authentication", href: "/rest-api/authentication", icon: <KeyRound className="w-3.5 h-3.5" /> },
      { label: "Organizations", href: "/rest-api/organizations", icon: <Building2 className="w-3.5 h-3.5" /> },
      { label: "Projects & API Keys", href: "/rest-api/projects", icon: <FolderKanban className="w-3.5 h-3.5" /> },
      { label: "Events", href: "/rest-api/events", icon: <Zap className="w-3.5 h-3.5" /> },
      { label: "Incidents", href: "/rest-api/incidents", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
      { label: "Ingestion Service", href: "/rest-api/ingestion", icon: <Radio className="w-3.5 h-3.5" /> },
    ],
  },
  {
    title: "Node.js SDK",
    icon: <Package className="w-4 h-4" />,
    basePath: "/sdk",
    items: [
      { label: "Overview", href: "/sdk", icon: <BookOpen className="w-3.5 h-3.5" /> },
      { label: "Installation", href: "/sdk/installation", icon: <Download className="w-3.5 h-3.5" /> },
      { label: "Quick Start", href: "/sdk/quick-start", icon: <PlayCircle className="w-3.5 h-3.5" /> },
      { label: "API Reference", href: "/sdk/reference", icon: <FileCode2 className="w-3.5 h-3.5" /> },
      { label: "Express Middleware", href: "/sdk/express", icon: <Puzzle className="w-3.5 h-3.5" /> },
    ],
  },
];

function NavSection({ section }: { section: NavSection }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(section.basePath);
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-1 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
          "text-[--color-sidebar-fg] hover:bg-[--color-sidebar-hover]"
        )}
      >
        <span className={cn("text-[--color-sidebar-fg]", isActive && "text-[--color-sidebar-active]")}>
          {section.icon}
        </span>
        <span className="flex-1 text-left">{section.title}</span>
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 transition-transform text-[--color-sidebar-fg]/50",
            open && "rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-[--color-sidebar-border] space-y-1.5">
          {section.items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-[--color-sidebar-active]/15 text-[--color-sidebar-active] font-medium"
                    : "text-[--color-sidebar-fg]/70 hover:bg-[--color-sidebar-hover] hover:text-[--color-sidebar-fg]"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[--color-sidebar-bg] border-r border-[--color-sidebar-border] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[--color-sidebar-border]">
        <div className="w-7 h-7 rounded-lg bg-[--color-sidebar-active] flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold leading-none">Vigilry</div>
          <div className="text-[--color-sidebar-fg]/50 text-xs mt-0.5">Developer Docs</div>
        </div>
      </div>

      {/* Introduction link */}
      <div className="px-3 pt-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            "text-[--color-sidebar-fg]/70 hover:bg-[--color-sidebar-hover] hover:text-[--color-sidebar-fg]"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Introduction
        </Link>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-2 mt-2">
        {navigation.map((section) => (
          <NavSection key={section.basePath} section={section} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[--color-sidebar-border]">
        <p className="text-xs text-[--color-sidebar-fg]/40">
          Vigilry Risk Engine · v0.1.5
        </p>
      </div>
    </aside>
  );
}
