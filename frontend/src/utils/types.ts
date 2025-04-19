export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "active" | "inactive";
    permissions: string[];
    avatarUrl?: string;
    initials?: string;
  }
  
  export interface SidebarItem {
    icon: string;
    label: string;
  }
  