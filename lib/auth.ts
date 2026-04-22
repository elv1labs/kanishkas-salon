import { getServerSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isCorrect = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isCorrect) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isDeactivated: !user.isActive,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        // Propagate deactivated flag so middleware can redirect
        if ((user as any).isDeactivated) {
          token.error = "AccountDeactivated";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  // ADMIN has ALL permissions — never deny an admin.
  if (userRole === "ADMIN") return true;

  const rolePermissions: Record<UserRole, string[]> = {
    ADMIN: [], // handled above
    OWNER: [
      "manageAppointments", "manageAllAppointments", "manageOrders", "manageProducts",
      "manageServices", "viewAnalytics", "manageContent", "manageClients", "viewClients",
      "manageBlog", "manageGallery", "createBlog", "createGallery",
    ],
    RECEPTIONIST: [
      "manageAppointments", "manageClients", "viewClients", "manageOrders",
      "manageBlog", "manageGallery", "createBlog", "createGallery",
    ],
    CLIENT: ["bookAppointments", "placeOrders", "viewOwnData"],
  };

  return rolePermissions[userRole]?.includes(permission) ?? false;
}
