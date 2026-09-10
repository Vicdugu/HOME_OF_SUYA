import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import {
  listCateringEnquiries,
  normalizeCateringStatus,
  updateCateringEnquiry,
} from "@/lib/catering-enquiries";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "50")));
  const skip = (page - 1) * limit;

  try {
    const [enquiries, totalResult] = await Promise.all([
      listCateringEnquiries(skip, limit),
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "CateringEnquiries"`,
    ]);
    
    const total = (totalResult as any[])?.[0]?.count ?? 0;
    
    return NextResponse.json({
      data: enquiries,
      pagination: { page, limit, total: parseInt(total), pages: Math.ceil(parseInt(total) / limit) },
    });
  } catch {
    return NextResponse.json(await listCateringEnquiries());
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const body = await req.json();
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Enquiry id is required" }, { status: 400 });
  }

  try {
    const enquiry = await updateCateringEnquiry(id, {
      status: normalizeCateringStatus(body.status),
      quoteAmount:
        body.quoteAmount === undefined || body.quoteAmount === null || body.quoteAmount === ""
          ? undefined
          : Number(body.quoteAmount),
      quoteNotes:
        body.quoteNotes === undefined ? undefined : String(body.quoteNotes ?? "").trim() || null,
      adminNotes:
        body.adminNotes === undefined ? undefined : String(body.adminNotes ?? "").trim() || null,
    });

    return NextResponse.json(enquiry);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update enquiry" },
      { status: 400 }
    );
  }
}