"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import { usePathname, useRouter } from "next/navigation";
import { ProfileIcon, ResultsIcon, AttendanceIcon, ClipboardIcon, PlannerIcon, PaymentsIcon } from "@/utils/icons";
import { useGetStudentPaymentConfig, useStudentGetMe } from "@/hooks/student";
import NotificationCard from "@/components/common/NotificationCard";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenuItem, setActiveMenuItem] = useState("Profile");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverviewPage, setIsOverviewPage] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  const {me} = useStudentGetMe();
  const { config: paymentConfig, isLoading: paymentConfigLoading } =
    useGetStudentPaymentConfig();

  const paymentsNotOnboarded =
    !paymentConfigLoading &&
    (paymentConfig?.status ?? "not_onboarded") === "not_onboarded";

  const sidebarItems = useMemo(() => {
    const base = [
      { icon: ProfileIcon, label: "Profile" },
      { icon: AttendanceIcon, label: "Attendance" },
      { icon: ResultsIcon, label: "Results" },
      { icon: ClipboardIcon, label: "My Scores" },
      { icon: PlannerIcon, label: "Planner" },
    ];
    if (paymentsNotOnboarded) {
      return base;
    }
    return [...base, { icon: PaymentsIcon, label: "My Payments" }];
  }, [paymentsNotOnboarded]);


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
    } else if (pathname === "/student/assignments") {
      setActiveMenuItem("My Scores");
      setIsOverviewPage(true);
    } else if (pathname === "/student/planner") {
      setActiveMenuItem("Planner");
      setIsOverviewPage(true);
    } else if (pathname === "/student/notifications") {
      setActiveMenuItem("Notifications");
      setIsOverviewPage(true);
    } else if (
      pathname === "/student/payments" ||
      pathname.startsWith("/student/payments/")
    ) {
      setActiveMenuItem("My Payments");
      setIsOverviewPage(true);
    } 
    
    // Default
    else {
      setIsOverviewPage(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!paymentsNotOnboarded) return;
    if (
      pathname === "/student/payments" ||
      pathname.startsWith("/student/payments/")
    ) {
      router.replace("/student/profile");
    }
  }, [paymentsNotOnboarded, pathname, router]);

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
      case "My Scores":
        router.push("/student/assignments");
        break;
      case "Planner":
        router.push("/student/planner");
        break;
      case "My Payments":
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

      <section className="box-border flex-1 p-5 max-md:p-2.5 max-sm:p-1.5 overflow-hidden relative">
        <HeaderSection
          user={me}
          isOverviewPage={isOverviewPage}
          activeMenuItem={activeMenuItem}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onNotificationClick={() => {
            setShowNotification(!showNotification);
          }}
        />
        <main className="flex-1 pt-8 overflow-auto">
          {children}
          {showNotification && me && (
            <NotificationCard
              user={me}
              source="student"
              inboxPath="/student/notifications"
              onClose={() => setShowNotification(false)}
            />
          )}
        </main>
      </section>
    </div>
  );
};

export default Layout;
