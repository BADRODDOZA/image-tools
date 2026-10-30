import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const BASE_PRICE = 75;

function getDiscountPercent(quantity: number) {
  if (quantity >= 50) return 50;

  if (quantity >= 20) return 36;

  if (quantity >= 6) return 28;

  return 0;
}

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const quantities = Array.isArray(body.quantities)
      ? body.quantities
      : [];

    if (quantities.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No card quantities were provided.",
        },
        { status: 400 }
      );
    }

    const cleanQuantities = quantities.map((value: unknown) => {
      const quantity = Math.floor(Number(value));

      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new Error("Invalid quantity.");
      }

      return quantity;
    });

    const totalQuantity = cleanQuantities.reduce(
      (total: number, quantity: number) => total + quantity,
      0
    );

    const subtotal = totalQuantity * BASE_PRICE;

    const discountPercent =
      getDiscountPercent(totalQuantity);

    const discountAmount = Math.round(
      (subtotal * discountPercent) / 100
    );

    const totalAmount = subtotal - discountAmount;

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `PVC-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}