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

export async function POST(request: Request) {
  try {
    // 1. Require a valid Supabase login token.
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Please log in to reveal this coupon.",
        },
        { status: 401 }
      );
    }

    const token = authorization.slice(7).trim();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Your login session is invalid. Please log in again.",
        },
        { status: 401 }
      );
    }

    // 2. Find the registered customer profile.
    const { data: customer, error: customerError } =
      await supabaseAdmin
        .from("store_customers")
        .select("id, mobile")
        .eq("id", user.id)
        .maybeSingle();

    if (customerError) {
      throw customerError;
    }

    if (!customer?.mobile) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer profile not found. Please complete registration.",
        },
        { status: 404 }
      );
    }

    const mobile = String(customer.mobile).replace(/\D/g, "").slice(-10);

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          error: "Your registered mobile number is invalid.",
        },
        { status: 400 }
      );
    }

    // 3. Read the requested coupon ID.
    const body = await request.json();
    const couponId =
      typeof body.couponId === "string"
        ? body.couponId.trim()
        : "";

    if (!couponId) {
      return NextResponse.json(
        {
          success: false,
          error: "Coupon ID is required.",
        },
        { status: 400 }
      );
    }

    // 4. Find the active coupon.
    const { data: coupon, error: couponError } =
      await supabaseAdmin
        .from("store_coupons")
        .select("*")
        .eq("id", couponId)
        .maybeSingle();

    if (couponError) {
      throw couponError;
    }

    if (!coupon || !coupon.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "This coupon is unavailable.",
        },
        { status: 404 }
      );
    }

    const now = Date.now();

    if (
      new Date(coupon.starts_at).getTime() > now ||
      (coupon.expires_at &&
        new Date(coupon.expires_at).getTime() < now)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This coupon is not currently valid.",
        },
        { status: 400 }
      );
    }

    // 5. Check the customer's paid store orders.
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
        { status: 403 }
      );
    }

    // 6. Check total coupon usage.
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
      (totalUses || 0) >= Number(coupon.usage_limit)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This coupon has reached its usage limit.",
        },
        { status: 400 }
      );
    }

    // 7. Check this customer's previous coupon usage.
    const { count: customerUses, error: customerUsesError } =
      await supabaseAdmin
        .from("store_coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("customer_mobile", mobile);

    if (customerUsesError) {
      throw customerUsesError;
    }

    if ((customerUses || 0) >= Number(coupon.per_customer_limit)) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already used this coupon.",
        },
        { status: 400 }
      );
    }

    // 8. Reveal the coupon code only after all checks pass.
    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        minimum_order_amount: coupon.minimum_order_amount,
        maximum_discount: coupon.maximum_discount,
        expires_at: coupon.expires_at,
      },
      message: "Coupon revealed successfully.",
    });
  } catch (error) {
    console.error("Coupon reveal error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to reveal this coupon.",
      },
      { status: 500 }
    );
  }
}