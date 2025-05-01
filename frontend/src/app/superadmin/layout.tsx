"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import { usePathname, useRouter } from "next/navigation";
import { DashboardIcon, UsersIcon, SchoolsIcon } from "@/utils/icons";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverviewPage, setIsOverviewPage] = useState(true);

  const sidebarItems = [
    {
      icon: DashboardIcon,
      label: "Dashboard",
    },
    {
      icon: UsersIcon,      
      label: "Users",
    },
    {
      icon: SchoolsIcon,      
      label: "Schools",
    },
  ];

  useEffect(() => {
    // Overview Pages
    if (pathname === "/superadmin/dashboard") {
      setActiveMenuItem("Dashboard");
      setIsOverviewPage(true);
    } else if (pathname === "/superadmin/users") {
      setActiveMenuItem("Users");
      setIsOverviewPage(true);
    } else if (pathname === "/superadmin/schools") {
      setActiveMenuItem("Schools");
      setIsOverviewPage(true);
    } 
    
    // Detail Pages
    else if (pathname.startsWith("/superadmin/schools/")) {
      setActiveMenuItem("Schools");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/superadmin/users/")) {
      setActiveMenuItem("Users");
      setIsOverviewPage(false);
    } 
    
    // Default
    else {
      setIsOverviewPage(false);
    }
  }, [pathname]);

  const handleSidebarClick = (item: string) => {
    switch (item) {
      case "Dashboard":
        router.push("/superadmin/dashboard");
        break;
      case "Users":
        router.push("/superadmin/users");
        break;
      case "Schools":
        router.push("/superadmin/schools");
        break;
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-row mx-auto w-full min-h-screen max-w-none bg-zinc-100 max-md:flex-col max-md:max-w-[991px] max-sm:max-w-screen-sm">
      {/* Sidebar for large screens */}
      <div className="hidden h-screen md:flex sticky top-0 overflow-y-auto bg-[#D9CDE2]">
        <Sidebar activeItem={activeMenuItem} sidebarItems={sidebarItems} onItemChange={handleSidebarClick} />
      </div>

      {/* Sidebar Overlay for small screens */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex min-h-[100%]">
          <div className="bg-[#D9CDE2] w-64 h-full shadow-lg overflow-y-auto">
            <Sidebar activeItem={activeMenuItem} sidebarItems={sidebarItems} onItemChange={handleSidebarClick} />
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <section className="box-border flex-1 p-5 max-md:p-2.5 max-sm:p-1.5 overflow-hidden">
        <HeaderSection isOverviewPage={isOverviewPage} activeMenuItem={activeMenuItem} onToggleSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 pt-8 overflow-auto">
          {children}
        </main>
      </section>
    </div>
  );
};

export default Layout;
