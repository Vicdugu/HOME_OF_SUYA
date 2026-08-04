import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import {
  listCateringEnquiries,
  normalizeCateringStatus,
  updateCateringEnquiry,
} from "@/lib/catering-enquiries";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  return NextResponse.json(await listCateringEnquiries());
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