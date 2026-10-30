import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Supabase server environment variables are missing."
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey
);

export async function POST(request: Request) {
  try {
    /*
     * -----------------------------------------------
     * 1. CHECK RAZORPAY ENVIRONMENT VARIABLES
     * -----------------------------------------------
     */

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Razorpay environment variables are missing.",
        },
        { status: 500 }
      );
    }

    /*
     * -----------------------------------------------
     * 2. READ STORE ORDER ID
     * -----------------------------------------------
     */

    const body = await request.json();

    const orderId =
      typeof body.orderId === "string"
        ? body.orderId
            .trim()
            .replace(/^#/, "")
        : "";

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Store order ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * -----------------------------------------------
     * 3. GET THE REAL ORDER FROM SUPABASE
     * -----------------------------------------------
     */

    const {
      data: storeOrder,
      error: storeOrderError,
    } =
      await supabaseAdmin
        .from("store_orders")
        .select(
          `
          id,
          total_amount,
          payment_status,
          status
          `
        )
        .eq("id", orderId)
        .maybeSingle();

    if (storeOrderError) {
      console.error(
        "Store order lookup error:",
        storeOrderError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to find the store order.",
        },
        { status: 500 }
      );
    }

    if (!storeOrder) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Store order not found.",
        },
        { status: 404 }
      );
    }

    /*
     * -----------------------------------------------
     * 4. PREVENT PAYING AN ALREADY PAID ORDER
     * -----------------------------------------------
     */

    if (
      String(
        storeOrder.payment_status || ""
      ).toLowerCase() === "paid"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This order has already been paid.",
        },
        { status: 400 }
      );
    }

    /*
     * -----------------------------------------------
     * 5. GET REAL DATABASE AMOUNT
     * -----------------------------------------------
     */

    const amount =
      Number(storeOrder.total_amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid store order amount.",
        },
        { status: 400 }
      );
    }

    /*
     * -----------------------------------------------
     * 6. CREATE RAZORPAY CLIENT
     * -----------------------------------------------
     */

    const razorpay =
      new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

    /*
     * -----------------------------------------------
     * 7. CREATE RAZORPAY ORDER
     * -----------------------------------------------
     *
     * The receipt and notes connect the Razorpay
     * order to the exact store order.
     */

    const razorpayOrder =
      await razorpay.orders.create({
        amount:
          Math.round(amount * 100),

        currency: "INR",

        receipt:
          `STORE-${storeOrder.id}`,

        notes: {
          order_type: "STORE",
          store_order_id:
            storeOrder.id,
        },
      });

    /*
     * -----------------------------------------------
     * 8. RETURN RAZORPAY INFORMATION
     * -----------------------------------------------
     */

    return NextResponse.json({
      success: true,

      razorpayOrderId:
        razorpayOrder.id,

      amount:
        razorpayOrder.amount,

      currency:
        razorpayOrder.currency,

      keyId,

      storeOrderId:
        storeOrder.id,
    });
  } catch (error) {
    console.error(
      "Store Razorpay create order error:",
      error
    );

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