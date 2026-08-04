import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logBookingEvent } from "@/lib/booking-analytics";
import { formatCartItemName } from "@/lib/meal-variations";
import { mergePromoCodeVisibility } from "@/lib/promo-code-visibility";
import { getRequestFingerprint, isRateLimited } from "@/lib/request-guard";
import { generateReference } from "@/lib/utils";
import { TIME_SLOTS } from "@/lib/availability";
import {
  buildDayAvailability,
  getSlotRemainingCapacity,
  isBookingWindowOpen,
  parseBookingDateOrNull,
} from "@/lib/booking-availability";

export async function POST(req: NextRequest) {
  const rateLimitKey = getRequestFingerprint(req, "bookings:create");
  if (isRateLimited(rateLimitKey, 8, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many booking attempts. Please wait a moment and try again." }, { status: 429 });
  }

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

  if (!TIME_SLOTS.some((slot) => slot.id === timeSlot)) {
    return NextResponse.json({ error: "Selected time slot is invalid" }, { status: 400 });
  }

  const parsedBookingDate = parseBookingDateOrNull(String(bookingDate ?? ""));
  if (!parsedBookingDate) {
    return NextResponse.json({ error: "Booking date is invalid" }, { status: 400 });
  }

  if (!isBookingWindowOpen(parsedBookingDate)) {
    return NextResponse.json(
      { error: "This booking date is no longer available. Please choose another date." },
      { status: 409 }
    );
  }

  const blocked = await prisma.blockedDate.findFirst({ where: { date: parsedBookingDate } });
  if (blocked) {
    return NextResponse.json(
      { error: "This date has just been blocked. Please choose another date." },
      { status: 409 }
    );
  }

  const sameDayBookings = await prisma.booking.findMany({
    where: { bookingDate: parsedBookingDate },
    select: {
      bookingDate: true,
      timeSlot: true,
      deliveryType: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
    },
  });

  const dayAvailability = buildDayAvailability(parsedBookingDate, sameDayBookings);
  if (getSlotRemainingCapacity(dayAvailability, timeSlot, deliveryType) <= 0) {
    return NextResponse.json(
      { error: "That time slot has just sold out for the selected delivery option." },
      { status: 409 }
    );
  }

  // Resolve promo code ID and increment usedCount
  let promoCodeId: string | null = null;
  if (promoCodeStr) {
    const promo = await prisma.promoCode.findFirst({
      where: { code: promoCodeStr, isActive: true },
    });
    const [promoWithVisibility] = promo ? await mergePromoCodeVisibility([promo]) : [null];
    if (promoWithVisibility && !promoWithVisibility.isHidden) {
      promoCodeId = promoWithVisibility.id;
      await prisma.promoCode.update({
        where: { id: promoWithVisibility.id },
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
      bookingDate: parsedBookingDate,
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

  await logBookingEvent({
    eventName: "booking_created",
    page: "payment",
    reference: booking.reference,
    metadata: {
      deliveryType,
      timeSlot,
      bookingDate,
      total,
      itemCount: Array.isArray(items) ? items.length : 0,
    },
  });

  return NextResponse.json({ id: booking.id, reference: booking.reference });
}
