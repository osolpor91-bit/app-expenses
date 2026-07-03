"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { canAccessTenantPage } from "@/lib/auth/tenantRolePermissions";

type AppNavLabels = {
  menu: string;
  configurations: string;
  admin: string;
  adminTenants: string;
  adminTenantUsers: string;
  adminUsersWithoutTenant: string;
};

type AppNavProps = {
  role: string;
  labels: AppNavLabels;
};

type OpenMenu = "admin" | null;

type NavLinkDefinition = {
  href: string;
  label: string;
  isVisible?: boolean;
};

type DropdownMenuProps = {
  menuKey: Exclude<OpenMenu, null>;
  label: string;
  links: NavLinkDefinition[];
  pathname: string;
  openMenu: OpenMenu;
  onToggle: (menu: Exclude<OpenMenu, null>) => void;
  onClose: () => void;
  minWidthClass?: string;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TopLink({
  href,
  label,
  pathname,
  activeHrefs = [],
}: {
  href: string;
  label: string;
  pathname: string;
  activeHrefs?: string[];
}) {
  const isActive =
    isActivePath(pathname, href) ||
    activeHrefs.some((activeHref) => isActivePath(pathname, activeHref));

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition ${isActive ? "text-primary-app" : "text-app-muted hover:text-primary-app"
        }`}
    >
      {label}
    </Link>
  );
}

function MenuButton({
  label,
  isOpen,
  onClick,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className="text-sm font-medium text-app-muted transition hover:text-primary-app"
    >
      {label}
    </button>
  );
}

function DropdownLink({
  href,
  label,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick: () => void;
}) {
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
        ? "bg-app-soft text-primary-app"
        : "text-app-muted hover:bg-app-soft hover:text-primary-app"
        }`}
    >
      {label}
    </Link>
  );
}

function DropdownMenu({
  menuKey,
  label,
  links,
  pathname,
  openMenu,
  onToggle,
  onClose,
  minWidthClass = "min-w-56",
}: DropdownMenuProps) {
  const visibleLinks = links.filter((link) => link.isVisible ?? true);
  const isOpen = openMenu === menuKey;

  return (
    <div className="relative">
      <MenuButton
        label={label}
        isOpen={isOpen}
        onClick={() => onToggle(menuKey)}
      />

      {isOpen && (
        <div
          className={`absolute left-0 z-50 mt-3 ${minWidthClass} rounded-xl border border-app bg-app p-2 shadow-lg`}
        >
          {visibleLinks.map((link) => (
            <DropdownLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
              onClick={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppNav({ role, labels }: AppNavProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const canAccessAdmin = canAccessTenantPage(role, "admin");

  const adminLinks: NavLinkDefinition[] = [
    {
      href: "/admin/tenants",
      label: labels.adminTenants,
    },
    {
      href: "/admin/tenant-users",
      label: labels.adminTenantUsers,
    },
    {
      href: "/admin/users-without-tenant",
      label: labels.adminUsersWithoutTenant,
    },
  ];

  function toggleMenu(menu: Exclude<OpenMenu, null>) {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  }

  function closeMenu() {
    setOpenMenu(null);
  }

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <nav ref={navRef} className="flex flex-wrap items-center gap-6">
      <TopLink href="/dashboard" label={labels.menu} pathname={pathname} />

      <TopLink
        href="/configurations"
        label={labels.configurations}
        pathname={pathname}
        activeHrefs={[
          "/companies",
          "/countries",
          "/suppliers",
          "/items",
          "/item-balance-entries",
          "/purchase-invoices",
          "/tax-areas",
          "/fiscal-treatments",
          "/portal-supplier-invoices",
          "/treasury-general",
          "/treasury-members",
        ]}
      />

      {canAccessAdmin && (
        <DropdownMenu
          menuKey="admin"
          label={labels.admin}
          links={adminLinks}
          pathname={pathname}
          openMenu={openMenu}
          onToggle={toggleMenu}
          onClose={closeMenu}
          minWidthClass="min-w-64"
        />
      )}
    </nav>
  );
}
