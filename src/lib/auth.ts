import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CredentialsProvider as any)({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.username || !credentials?.password) {
          console.log("[auth] Missing credentials");
          return null;
        }

        try {
          const user = await prisma.adminUser.findUnique({
            where: { username: credentials.username },
          });

          console.log("[auth] User found:", !!user);

          if (!user) return null;

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          console.log("[auth] Password valid:", valid);

          if (!valid) return null;

          return { id: user.id, name: user.username };
        } catch (err) {
          console.error("[auth] Error:", err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.name = token.name;
      return session;
    },
  },
};
