export interface Role {
    id: string;
    name: string;
}

export enum ButtonType {
    submit = "submit",
    reset = "reset",
    button = "button",
  }

export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: Role;
    status: string
}

export type AuthCredentials = Pick<User, "email"| "password">;
export type SignUpPayload = Pick<User, "email" | "password" | "name" | "role" >;
