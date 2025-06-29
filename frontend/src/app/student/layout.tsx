"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import { usePathname, useRouter } from "next/navigation";
import { DashboardIcon, UsersIcon, SchoolsIcon } from "@/utils/icons";
import { useStudentGetMe } from "@/hooks/student";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenuItem, setActiveMenuItem] = useState("Profile");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverviewPage, setIsOverviewPage] = useState(true);

  const {me} = useStudentGetMe();

  const sidebarItems = [
    {
      icon: DashboardIcon,
      label: "Profile",
    },
    {
      icon: UsersIcon,      
      label: "Attendance",
    },
    {
      icon: SchoolsIcon,      
      label: "Results",
    },
    {
      icon: SchoolsIcon,      
      label: "Payments",
    },
  ];


  useEffect(() => {
    // Overview Pages
    if (pathname === "/student/profile") {
      setActiveMenuItem("Profile");
      setIsOverviewPage(true);
    } else if (pathname === "/student/attendance") {
      setActiveMenuItem("Attendance");
      setIsOverviewPage(true);
    } else if (pathname === "/student/results") {
      setActiveMenuItem("Results");
      setIsOverviewPage(true);
    } else if (pathname === "/student/payments") {
      setActiveMenuItem("Payments");
      setIsOverviewPage(true);
    } 
    
    // Default
    else {
      setIsOverviewPage(false);
    }
  }, [pathname]);

  const handleSidebarClick = (item: string) => {
    switch (item) {
      case "Profile":
        router.push("/student/profile");
        break;
      case "Attendance":
        router.push("/student/attendance");
        break;
      case "Results":
        router.push("/student/results");
        break;
      case "Payments":
        router.push("/student/payments");
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
        <HeaderSection user={me} isOverviewPage={isOverviewPage} activeMenuItem={activeMenuItem} onToggleSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 pt-8 overflow-auto">
          {children}
        </main>
      </section>
    </div>
  );
};

export default Layout;
