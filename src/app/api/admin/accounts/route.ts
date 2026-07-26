import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";
import {
  adminUsernameOrEmailExists,
  createManualAdminUser,
  ensureAdminAccountColumns,
  listAllAdmins,
} from "@/lib/admin-queries";

async function checkAuth(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return !!(await verifyAdminToken(token));
}

export async function GET(req: NextRequest) {
  if (!(await checkAuth(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admins = await listAllAdmins();
  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAdminAccountColumns();

  const { fullName, username, email, password, role, status } = await req.json();
  const normalizedFullName = typeof fullName === "string" ? fullName.trim() : "";
  const normalizedUsername = typeof username === "string" ? username.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  const normalizedRole = typeof role === "string" ? role.trim().toUpperCase() : "ADMIN";
  const normalizedStatus = typeof status === "string" ? status.trim().toUpperCase() : "ACTIVE";

  if (!normalizedFullName || !normalizedUsername || !normalizedEmail || !normalizedPassword) {
    return NextResponse.json(
      { error: "Name, username, email, and password are required" },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (normalizedPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long" },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(normalizedUsername)) {
    return NextResponse.json(
      { error: "Username must be 3-30 characters and use only letters, numbers, dots, dashes, or underscores" },
      { status: 400 }
    );
  }

  const allowedRoles = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER"]);
  const allowedStatuses = new Set(["ACTIVE", "DISABLED"]);

  if (!allowedRoles.has(normalizedRole)) {
    return NextResponse.json({ error: "Invalid role selected" }, { status: 400 });
  }

  if (!allowedStatuses.has(normalizedStatus)) {
    return NextResponse.json({ error: "Invalid status selected" }, { status: 400 });
  }

  if (await adminUsernameOrEmailExists(normalizedUsername, normalizedEmail)) {
    return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 12);
  const created = await createManualAdminUser({
    fullName: normalizedFullName,
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    role: normalizedRole,
    status: normalizedStatus,
  });

  return NextResponse.json(
    {
      ok: true,
      admin: {
        id: created.id,
        fullName: normalizedFullName,
        username: normalizedUsername,
        email: normalizedEmail,
        role: normalizedRole,
        status: normalizedStatus,
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
    },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  const count = await prisma.adminUser.count();
  if (count <= 1) {
    return NextResponse.json({ error: "Cannot delete the last admin account" }, { status: 400 });
  }

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

