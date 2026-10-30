
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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const orderId = String(id || "").trim().replace(/^#/, "");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const mobile = String(body.mobile || "").trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number." },
        { status: 400 }
      );
    }

    // Find the order belonging to this mobile number.
    const { data: order, error: lookupError } =
      await supabaseAdmin
        .from("store_orders")
        .select("id, mobile, status, payment_status")
        .eq("id", orderId)
        .eq("mobile", mobile)
        .maybeSingle();

    if (lookupError) {
      console.error("Cancel order lookup error:", lookupError);

      return NextResponse.json(
        { success: false, error: "Unable to verify your order." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (String(order.status).toLowerCase() !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Only pending orders can be cancelled.",
        },
        { status: 400 }
      );
    }

    // Paid orders require a separate refund process.
    if (String(order.payment_status).toLowerCase() === "paid") {
      return NextResponse.json(
        {
          success: false,
          error: "This order has already been paid. Please contact support for cancellation and refund assistance.",
        },
        { status: 400 }
      );
    }

    // Update only an order that is still pending and unpaid.
    const { data: updatedOrder, error: updateError } =
      await supabaseAdmin
        .from("store_orders")
        .update({ status: "Cancelled" })
        .eq("id", orderId)
        .eq("mobile", mobile)
        .eq("status", "Pending")
        .neq("payment_status", "Paid")
        .select("id, status, payment_status")
        .maybeSingle();

    if (updateError) {
      console.error("Cancel order update error:", updateError);

      return NextResponse.json(
        { success: false, error: "Unable to cancel your order." },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "The order could not be cancelled. Please refresh and try again.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your order has been cancelled successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Cancel order API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to cancel order.",
      },
      { status: 500 }
    );
  }
}
