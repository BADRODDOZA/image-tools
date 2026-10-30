
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

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code =
      typeof body.code === "string"
        ? body.code.trim().toUpperCase()
        : "";

    const mobile =
      typeof body.mobile === "string"
        ? body.mobile.replace(/\D/g, "")
        : "";

    const subtotal = Number(body.subtotal);

    if (!/^[A-Z0-9_-]{2,50}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid coupon code." },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid 10-digit mobile number first." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order subtotal." },
        { status: 400 }
      );
    }

    const { data: coupon, error: couponError } =
      await supabaseAdmin
        .from("store_coupons")
        .select("*")
        .eq("code", code)
        .maybeSingle();

    if (couponError) {
      throw couponError;
    }

    if (!coupon || !coupon.is_active) {
      return NextResponse.json(
        { success: false, error: "This coupon is invalid or inactive." },
        { status: 400 }
      );
    }

    const now = Date.now();

    if (
      new Date(coupon.starts_at).getTime() > now ||
      (coupon.expires_at &&
        new Date(coupon.expires_at).getTime() < now)
    ) {
      return NextResponse.json(
        { success: false, error: "This coupon is not currently valid." },
        { status: 400 }
      );
    }

    if (subtotal < Number(coupon.minimum_order_amount || 0)) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order amount is ₹${coupon.minimum_order_amount}.`,
        },
        { status: 400 }
      );
    }

    const { data: paidOrders, error: paidOrdersError } =
      await supabaseAdmin
        .from("store_orders")
        .select("id, total_amount")
        .eq("mobile", mobile)
        .ilike("payment_status", "paid");

    if (paidOrdersError) {
      throw paidOrdersError;
    }

    const previousOrders = paidOrders || [];
    const orderCount = previousOrders.length;

    const totalSpend = previousOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );

    const isNew = orderCount === 0;
    const isVip = orderCount >= 5 && totalSpend > 0;

    const eligible =
      coupon.customer_type === "both"
        ? isNew || isVip
        : coupon.customer_type === "new"
          ? isNew
          : coupon.customer_type === "vip"
            ? isVip
            : false;

    if (!eligible) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not eligible for this coupon.",
        },
        { status: 400 }
      );
    }

    const { count: totalUses, error: totalUsesError } =
      await supabaseAdmin
        .from("store_coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);

    if (totalUsesError) {
      throw totalUsesError;
    }

    if (
      coupon.usage_limit !== null &&
      (totalUses || 0) >= coupon.usage_limit
    ) {
      return NextResponse.json(
        { success: false, error: "This coupon has reached its usage limit." },
        { status: 400 }
      );
    }

    const { count: customerUses, error: customerUsesError } =
      await supabaseAdmin
        .from("store_coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("customer_mobile", mobile);

    if (customerUsesError) {
      throw customerUsesError;
    }

    if ((customerUses || 0) >= coupon.per_customer_limit) {
      return NextResponse.json(
        { success: false, error: "You have already used this coupon." },
        { status: 400 }
      );
    }

    let discount = 0;

    if (coupon.discount_type === "percentage") {
      discount = subtotal * Number(coupon.discount_value) / 100;
    } else if (coupon.discount_type === "fixed") {
      discount = Number(coupon.discount_value);
    }

    if (coupon.maximum_discount !== null) {
      discount = Math.min(discount, Number(coupon.maximum_discount));
    }

    discount = money(Math.min(discount, subtotal));

    if (discount <= 0) {
      return NextResponse.json(
        { success: false, error: "This coupon has no valid discount." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      couponId: coupon.id,
      couponCode: coupon.code,
      discount,
      subtotal: money(subtotal),
      payableAmount: money(subtotal - discount),
      message: "Coupon applied successfully.",
    });
  } catch (error) {
    console.error("Coupon validation error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to validate this coupon." },
      { status: 500 }
    );
  }
}
