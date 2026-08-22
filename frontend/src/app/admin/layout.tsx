"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { DashboardIcon, ClassroomIcon, UsersIcon, AdmissionsIcon, AttendanceIcon, StudentsIcon, PaymentsIcon, SubjectIcon, ScoreIcon, PlannerIcon, PerformanceIcon } from "@/utils/icons";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import { useGetMe } from "@/hooks/school-admin";
import NotificationCard from "@/components/common/NotificationCard";
import { Roles } from "@/@types";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isOverviewPage, setIsOverviewPage] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  const handleToggleSidebar = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
      setIsDesktopSidebarOpen((open) => !open);
      return;
    }
    setIsMobileSidebarOpen((open) => !open);
  };

  const {me} = useGetMe();

  const sidebarItems = [
    {
      icon: DashboardIcon,
      label: "Dashboard",
    },
    {
      icon: StudentsIcon,      
      label: "Students",
    },
    {
      icon: AttendanceIcon,      
      label: "Attendance",
    },
    {
      icon: ClassroomIcon,      
      label: "Classes",
    },
    {
      icon: ScoreIcon,
      label: "Scores"
    },
    {
      icon: PerformanceIcon,
      label: "Performance Analytics"
    },
    {
      icon: AdmissionsIcon,      
      label: "Admissions",
    },
    {
      icon: PaymentsIcon,
      label: "Payments & Finance",
    },
    {
      icon: SubjectIcon,
      label: "Curriculum",
    },
    {
      icon: PlannerIcon,
      label: "Planner"
    },
    {
      icon: UsersIcon,      
      label: "All Users",
    },
  ];

  useEffect(() => {
    // Overview Pages
    if (pathname === "/admin/dashboard") {
      setActiveMenuItem("Dashboard");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/users") {
      setActiveMenuItem("All Users");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/students") {
      setActiveMenuItem("Students");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/payments" ||
      pathname.startsWith("/admin/payments/receipt")
    ) {
      setActiveMenuItem("Payments & Finance");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/admissions") {
      setActiveMenuItem("Admissions");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/attendance") {
      setActiveMenuItem("Attendance");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/classes") {
      setActiveMenuItem("Classes");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/results-review") {
      setActiveMenuItem("Classes");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/settings") {
      setActiveMenuItem("Settings");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/subjects" || 
      pathname.startsWith("/admin/subjects/curriculum") || 
      pathname.startsWith("/admin/subjects/topics")) {
      setActiveMenuItem("Curriculum");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/assignments" || pathname.startsWith("/admin/assignments/")) {
      setActiveMenuItem("Scores");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/performance-analytics" || pathname.startsWith("/admin/performance-analytics/")) {
      setActiveMenuItem("Performance Analytics");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/notifications") {
      setActiveMenuItem("Notifications");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/planner") {
      setActiveMenuItem("Planner");
      setIsOverviewPage(true);
    }
    
    // Detail Pages
    else if (pathname.startsWith("/admin/schools/")) {
      setActiveMenuItem("Schools");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/users/")) {
      setActiveMenuItem("Users");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/settings/")) {
      setActiveMenuItem("Settings");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/students/")) {
      setActiveMenuItem("Students");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/admissions/")) {
      setActiveMenuItem("Admissions");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/attendance/")) {
      setActiveMenuItem("Attendance");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/classes/")) {
      setActiveMenuItem("Classes");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/notifications/")) {
      setActiveMenuItem("Notifications");
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
        router.push("/admin/dashboard");
        break;
      case "All Users":
        router.push("/admin/users");
        break;
      case "Students":
        router.push("/admin/students");
        break;
      case "Payments & Finance":
        router.push("/admin/payments");
        break;
      case "Admissions":
        router.push("/admin/admissions");
        break;
      case "Attendance":
        router.push("/admin/attendance");
        break;
      case "Classes":
        router.push("/admin/classes");
        break;
      case "Settings":
        router.push("/admin/settings");
        break;
      case "Curriculum":
        router.push("/admin/subjects");
        break;
      case "Scores":
        router.push("/admin/assignments");
        break;
      case "Performance Analytics":
        router.push("/admin/performance-analytics");
        break;
      case "Planner":
        router.push("/admin/planner");
        break;
    }
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex flex-row mx-auto w-full min-h-screen max-w-none bg-zinc-100 max-md:flex-col max-md:max-w-[991px] max-sm:max-w-screen-sm">
      {/* Sidebar for large screens — slides in/out and shifts main content */}
      <div
        className={`hidden md:block h-screen sticky top-0 overflow-hidden bg-[#D9CDE2] shrink-0 transition-[width] duration-300 ease-in-out ${
          isDesktopSidebarOpen ? "w-60" : "w-0"
        }`}
        aria-hidden={!isDesktopSidebarOpen}
      >
        <div className="w-60 h-full overflow-y-auto overflow-x-hidden">
          <Sidebar
            activeItem={activeMenuItem}
            sidebarItems={sidebarItems}
            onItemChange={handleSidebarClick}
            isSchoolAdminDashboard={true}
          />
        </div>
      </div>

      {/* Sidebar Overlay for small screens */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex min-h-[100%] md:hidden">
          <div className="bg-[#D9CDE2] w-64 h-full shadow-lg overflow-y-auto">
            <Sidebar
              activeItem={activeMenuItem}
              sidebarItems={sidebarItems}
              onItemChange={handleSidebarClick}
              isSchoolAdminDashboard={true}
            />
          </div>
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      )}

      <section className="box-border flex-1 min-w-0 p-5 max-md:p-2.5 max-sm:p-1.5 overflow-hidden relative transition-[width] duration-300 ease-in-out">
        <HeaderSection
          user={me}
          isOverviewPage={isOverviewPage}
          activeMenuItem={activeMenuItem}
          onToggleSidebar={handleToggleSidebar}
          isSidebarExpanded={isDesktopSidebarOpen}
          showSidebarToggleOnDesktop
          onNotificationClick={() => {
            setShowNotification(!showNotification);
          }}
        />
        <main className="flex-1 pt-8 overflow-auto">
          {children}
          {showNotification && me.role.name === Roles.SCHOOL_ADMIN && (
            <NotificationCard
              user={me}
              source="admin"
              inboxPath="/admin/notifications"
              onClose={() => setShowNotification(false)}
            />
          )}
        </main>
      </section>
    </div>
  );
};

export default Layout;
