import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Supabase server environment variables are missing.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    let orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    // Allow the customer to enter the Order ID with or without #
    orderId = orderId.trim().replace(/^#/, "");

    /*
     * =========================================================
     * 1. CHECK PVC ORDER
     * =========================================================
     */

    const { data: pvcOrder, error: pvcError } =
      await supabaseAdmin
        .from("pvc_orders")
        .select(
          "id, card_type, quantity, amount, payment_status, status, created_at"
        )
        .eq("id", orderId)
        .maybeSingle();

    if (pvcError) {
      console.error("PVC order tracking error:", pvcError);
    }

    if (pvcOrder) {
      return NextResponse.json({
        success: true,
        orderType: "PVC",
        order: pvcOrder,
      });
    }

    /*
     * =========================================================
     * 2. CHECK A4 PAPER / PRINTER INK ORDER
     * =========================================================
     */

    const { data: storeOrder, error: storeError } =
      await supabaseAdmin
        .from("store_orders")
        .select(
          "id, customer_name, mobile, address, landmark, city, state, pin_code, total_amount, status, payment_status, created_at"
        )
        .eq("id", orderId)
        .maybeSingle();

    if (storeError) {
      console.error("Store order tracking error:", storeError);

      return NextResponse.json(
        {
          success: false,
          error: storeError.message,
        },
        { status: 500 }
      );
    }

    if (!storeOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found. Please check your Order ID.",
        },
        { status: 404 }
      );
    }

    /*
     * =========================================================
     * 3. GET A4 PAPER / PRINTER INK ORDER ITEMS
     * =========================================================
     */

    const { data: items, error: itemsError } =
      await supabaseAdmin
        .from("store_order_items")
        .select(
          "id, product_id, product_name, quantity, price, total"
        )
        .eq("order_id", orderId);

    if (itemsError) {
      console.error(
        "Store order items tracking error:",
        itemsError
      );

      return NextResponse.json(
        {
          success: false,
          error: itemsError.message,
        },
        { status: 500 }
      );
    }

    /*
     * =========================================================
     * 4. RETURN STORE ORDER
     * =========================================================
     */

    return NextResponse.json({
      success: true,
      orderType: "STORE",
      order: storeOrder,
      items: items || [],
    });
  } catch (error) {
    console.error("Track order API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to track order.",
      },
      { status: 500 }
    );
  }
}