import { DefaultSession } from "next-auth"
import type { Permissions } from "./permissions"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      permissions: Permissions
    } & DefaultSession["user"]
  }
}
