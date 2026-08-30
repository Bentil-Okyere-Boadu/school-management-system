"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import FullPageSpinner from "@/components/common/FullPageSpinner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardIcon } from "@/utils/icons";
import { useParentGetMe } from "@/hooks/parent";
import type { User } from "@/@types";

const FAMILY_DASHBOARD = "Family Dashboard";

const ParentLayoutShell = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeMenuItem, setActiveMenuItem] = useState(FAMILY_DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverviewPage, setIsOverviewPage] = useState(true);

  const { me } = useParentGetMe();

  const sidebarItems = useMemo(
    () => [{ icon: DashboardIcon, label: FAMILY_DASHBOARD }],
    [],
  );

  useEffect(() => {
    setActiveMenuItem(FAMILY_DASHBOARD);
    setIsOverviewPage(pathname === "/parent");
  }, [pathname]);

  const handleSidebarClick = (_item: string) => {
    const query = searchParams.toString();
    router.push(query ? `/parent?${query}` : "/parent");
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-row mx-auto w-full min-h-screen max-w-none bg-zinc-100 max-md:flex-col max-md:max-w-[991px] max-sm:max-w-screen-sm">
      <div className="hidden h-screen md:flex sticky top-0 overflow-y-auto bg-[#D9CDE2]">
        <Sidebar
          activeItem={activeMenuItem}
          sidebarItems={sidebarItems}
          onItemChange={handleSidebarClick}
        />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex min-h-[100%]">
          <div className="bg-[#D9CDE2] w-64 h-full shadow-lg overflow-y-auto">
            <Sidebar
              activeItem={activeMenuItem}
              sidebarItems={sidebarItems}
              onItemChange={handleSidebarClick}
            />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      <section className="box-border flex-1 p-5 max-md:p-2.5 max-sm:p-1.5 overflow-hidden">
        <HeaderSection
          user={me as User}
          isOverviewPage={isOverviewPage}
          activeMenuItem={activeMenuItem}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 pt-8 overflow-auto">
          <Suspense fallback={<FullPageSpinner />}>{children}</Suspense>
        </main>
      </section>
    </div>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <ParentLayoutShell>{children}</ParentLayoutShell>
    </Suspense>
  );
};

export default Layout;
