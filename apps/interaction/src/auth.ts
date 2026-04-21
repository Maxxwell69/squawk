import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Email from "next-auth/providers/email";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "database" },
  providers: [
    Email({
      server: process.env.EMAIL_SERVER,
      from:
        process.env.EMAIL_FROM ?? "Captain Squawks <noreply@piratemaxx.com>",
      async sendVerificationRequest({ identifier, url, provider }) {
        const email = identifier.trim().toLowerCase();
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const invited = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (email !== adminEmail && !invited) {
          throw new Error(
            "This email is not on the crew list. Ask the captain to add you as a moderator."
          );
        }

        const server = provider.server;
        if (!server) {
          throw new Error("EMAIL_SERVER is not configured.");
        }
        const transport = nodemailer.createTransport(server);
        const from = (provider.from as string) ?? "Captain Squawks";
        const { host } = new URL(url);
        await transport.sendMail({
          to: identifier,
          from,
          subject: `Sign in to Captain Squawks (${host})`,
          text: `Sign in to Captain Squawks\n${url}\n\n`,
          html: `<body><p>Sign in to <strong>Captain Squawks</strong></p><p><a href="${url}">Click here to sign in</a></p><p style="color:#666;font-size:12px">If you did not request this email, you can ignore it.</p></body>`,
        });
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (!adminEmail || !user.email) return;
      if (user.email.toLowerCase() === adminEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (email === adminEmail) return true;
      const row = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      return !!row;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      const row = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      session.user.role = row?.role ?? "MEMBER";
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
});
