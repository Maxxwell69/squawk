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

    const invited = !!existing;
    const isCaptainBootstrap = Boolean(
      adminEmail && email === adminEmail && !existing
    );

    if (!isCaptainBootstrap && !invited) {
      return NextResponse.json(
        { error: "not_invited" },
        { status: 403 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    if (isCaptainBootstrap) {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "ADMIN",
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  } catch (err) {
    console.error("[crew/register]", err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2022 etc. often means migrations not applied (missing column).
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
