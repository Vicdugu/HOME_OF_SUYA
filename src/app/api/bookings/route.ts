import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCartItemName } from "@/lib/meal-variations";
import { generateReference } from "@/lib/utils";
import { fromDateString } from "@/lib/availability";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    items,
    deliveryType,
    deliveryFee,
    subtotal,
    discount,
    total,
    bookingDate,
    timeSlot,
    customerName,
    customerWhatsapp,
    customerEmail,
    customerAddress,
    customerNotes,
    promoCode: promoCodeStr,
  } = body;

  // Basic validation
  if (
    !items?.length ||
    !deliveryType ||
    !bookingDate ||
    !timeSlot ||
    !customerName ||
    !customerWhatsapp
  ) {
    return NextResponse.json(
      { error: "Missing required booking fields" },
      { status: 400 }
    );
  }

  // Resolve promo code ID and increment usedCount
  let promoCodeId: string | null = null;
  if (promoCodeStr) {
    const promo = await prisma.promoCode.findFirst({
      where: { code: promoCodeStr, isActive: true },
    });
    if (promo) {
      promoCodeId = promo.id;
      await prisma.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      });
    }
  }

  const reference = generateReference();

  const booking = await prisma.booking.create({
    data: {
      reference,
      customerName,
      whatsapp: customerWhatsapp,
      email: customerEmail || null,
      address: customerAddress || null,
      notes: customerNotes || null,
      deliveryType,
      deliveryFee: deliveryFee ?? 0,
      subtotal,
      discount: discount ?? 0,
      total,
      bookingDate: fromDateString(bookingDate),
      timeSlot,
      status: "PENDING",
      paymentStatus: "UNPAID",
      promoCodeId,
      items: {
        create: items.map(
          (item: {
            cartItemId?: string;
            mealId: string;
            mealName: string;
            quantity: number;
            unitPrice: number;
            selections: Array<{
              groupId: string;
              groupName: string;
              selectionType: "SINGLE" | "MULTIPLE";
              optionIds: string[];
              optionNames: string[];
            }>;
          }) => ({
            mealId: item.mealId,
            mealName: formatCartItemName(item),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })
        ),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ id: booking.id, reference: booking.reference });
}
