import { NextResponse } from "next/server";
import { MOCK_DELIVERY_SETTINGS } from "@/lib/mock-data";

export async function GET() {
  // Once DB is connected, replace with:
  // const settings = await prisma.deliverySettings.findFirst();
  return NextResponse.json(MOCK_DELIVERY_SETTINGS);
}
