import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "already_registered" },
        { status: 409 }
      );
    }

    const invite = await prisma.crewInvite.findUnique({
      where: { email },
    });

    const isCaptainBootstrap = Boolean(
      adminEmail && email === adminEmail && !existing
    );

    if (isCaptainBootstrap) {
      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "ADMIN",
        },
      });
      if (invite) {
        await prisma.crewInvite.update({
          where: { email },
          data: { status: "REGISTERED" },
        });
      }
      return NextResponse.json({ ok: true });
    }

    const modOrIncompleteUser = Boolean(existing && !existing.passwordHash);

    if (invite?.status === "PENDING" && !modOrIncompleteUser) {
      return NextResponse.json(
        { error: "pending_approval" },
        { status: 403 }
      );
    }
    if (invite?.status === "REVOKED" && !modOrIncompleteUser) {
      return NextResponse.json({ error: "invite_revoked" }, { status: 403 });
    }

    const invitedStubUser = modOrIncompleteUser;
    const approvedInvite =
      invite?.status === "APPROVED" &&
      (!existing || !existing.passwordHash);

    if (!invitedStubUser && !approvedInvite) {
      return NextResponse.json({ error: "not_invited" }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash },
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "MEMBER",
        },
      });
    }

    if (invite?.status === "APPROVED") {
      await prisma.crewInvite.update({
        where: { email },
        data: { status: "REGISTERED" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[crew/register]", err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: "database_error",
          code: err.code,
          hint:
            process.env.NODE_ENV !== "production"
              ? err.message
              : "Ensure DATABASE_URL works and prisma migrate deploy has run.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "server_error",
        hint:
          process.env.NODE_ENV !== "production" && err instanceof Error
            ? err.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
