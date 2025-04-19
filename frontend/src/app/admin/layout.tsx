"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { UserHeader } from "@/components/admin/UserHeader";
import { usePathname } from "next/navigation";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    if(pathname.includes("/admin/users")) {
      setActiveMenuItem("Users");
    } else if (pathname.includes("/admin/schools")) {
      setActiveMenuItem("Schools");
    } else if (pathname.includes("/admin/dashboard")) {
      setActiveMenuItem("Dashboard");
    } else {
      setActiveMenuItem("Dashboard");
    }
}, [pathname]);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      <div className="flex flex-row mx-auto w-full min-h-screen max-w-none bg-zinc-100 max-md:flex-col max-md:max-w-[991px] max-sm:max-w-screen-sm">
        {/* Sidebar for large screens */}
        <div className="hidden h-screen md:flex sticky top-0 overflow-y-auto bg-[#D9CDE2]">
          <Sidebar activeItem={activeMenuItem} onItemChange={setActiveMenuItem} />
        </div>

        {/* Sidebar Overlay for small screens */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex min-h-[100%]">
            <div className="bg-[#D9CDE2] w-64 h-full shadow-lg overflow-y-auto">
              <Sidebar activeItem={activeMenuItem} onItemChange={(item) => {
                setActiveMenuItem(item);
                setIsSidebarOpen(false);
              }} />
            </div>
            {/* Backdrop */}
            <div className="flex-1 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          </div>
        )}

        <section className="box-border flex-1 p-5 max-md:p-2.5 max-sm:p-1.5 overflow-hidden">
          <UserHeader onToggleSidebar={() => setIsSidebarOpen(true)} />
          <main className="flex-1 pt-8 overflow-auto">
            {children}
          </main>
        </section>
      </div>
    </>
  );
};

export default Layout;
