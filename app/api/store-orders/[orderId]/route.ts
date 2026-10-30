import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      orderId: string;
    }>;
  }
) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is missing.",
        },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("store_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Store order fetch error:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          error: orderError.message,
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 }
      );
    }

    const {
      data: items,
      error: itemsError,
    } = await supabaseAdmin
      .from("store_order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error(
        "Store order items fetch error:",
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

    return NextResponse.json({
      success: true,
      order,
      items: items || [],
    });
  } catch (error) {
    console.error(
      "Store order API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}