export enum ButtonType {
    submit = "submit",
    reset = "reset",
    button = "button",
  }

  export type School = {
    id: string;
    email: string;
    address: string;
    phone: string;
    name: string;
  }
export interface User {
    id: string;
    email: string;
    password?: string;
    name: string;
    role: Role;
    status: string;
    school: School;
}

export type AuthCredentials = Pick<User, "email"| "password">;
export type SignUpPayload = Pick<User, "email" | "password" | "name" | "role" >;

export enum Roles {
    SCHOOL_ADMIN="school_admin",
    STUDENT="student",
    TEACHER="teacher",
    SUPER_ADMIN="super_admin",
    PARENT="parent"
}

export type Role = {
    id: string;
    name: keyof typeof Roles;
  };

export type FeeStructure = {
    id: string;
    feeTitle: string,
     feeType: string,
     amount: number,
     appliesTo: string,
     dueDate: string,
     classes: string[]
    }

export type SchoolAdminInfo = {
  email: string;
  phone: string;
  address: string;
  name: string;
  role: {
    label: string;
  }
}