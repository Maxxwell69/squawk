import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const emailSchema = z.object({
  email: z.string().email(),
});

const patchSchema = z.object({
  email: z.string().email(),
  action: z.enum(["approve", "revoke"]),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

/** Add someone to the approval queue (pending until you approve). */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = emailSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (email === adminEmail) {
    return NextResponse.json(
      { error: "use_captain_bootstrap" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.passwordHash) {
    return NextResponse.json({ error: "already_registered" }, { status: 400 });
  }

  const existingInvite = await prisma.crewInvite.findUnique({
    where: { email },
  });

  if (existingInvite?.status === "PENDING") {
    return NextResponse.json({ error: "already_pending" }, { status: 409 });
  }
  if (existingInvite?.status === "APPROVED") {
    return NextResponse.json({ error: "already_approved" }, { status: 409 });
  }
  if (existingInvite?.status === "REGISTERED") {
    return NextResponse.json({ error: "already_completed" }, { status: 400 });
  }

  if (existingInvite?.status === "REVOKED") {
    await prisma.crewInvite.update({
      where: { email },
      data: { status: "PENDING" },
    });
  } else {
    await prisma.crewInvite.create({
      data: { email, status: "PENDING" },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { action } = parsed.data;

  const invite = await prisma.crewInvite.findUnique({ where: { email } });
  if (!invite) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (action === "approve") {
    if (invite.status === "REGISTERED") {
      return NextResponse.json({ error: "already_completed" }, { status: 400 });
    }
    await prisma.crewInvite.update({
      where: { email },
      data: { status: "APPROVED" },
    });
  } else {
    await prisma.crewInvite.update({
      where: { email },
      data: { status: "REVOKED" },
    });
  }

  return NextResponse.json({ ok: true });
}
