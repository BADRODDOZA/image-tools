
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const adminPassword =
  process.env.ADMIN_PASSWORD ||
  process.env.STORE_ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Supabase server environment variables are missing.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey
);

function isAuthenticated(request: Request) {
  const password =
    request.headers.get("x-admin-password") ||
    request.headers.get("admin-password");

  return Boolean(adminPassword && password === adminPassword);
}

function validateCoupon(body: any) {
  const code = String(body.code || "").trim().toUpperCase();
  const description = String(body.description || "").trim();
  const discountType = String(body.discount_type || "");
  const discountValue = Number(body.discount_value);
  const customerType = String(body.customer_type || "both");
  const minimumOrderAmount = Number(body.minimum_order_amount ?? 0);
  const maximumDiscount =
    body.maximum_discount === "" ||
    body.maximum_discount === null ||
    body.maximum_discount === undefined
      ? null
      : Number(body.maximum_discount);

  const usageLimit =
    body.usage_limit === "" ||
    body.usage_limit === null ||
    body.usage_limit === undefined
      ? null
      : Number(body.usage_limit);

  const perCustomerLimit = Number(body.per_customer_limit ?? 1);

  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return { error: "Coupon code must be 3–30 characters using letters, numbers, hyphens or underscores." };
  }

  if (!["percentage", "fixed"].includes(discountType)) {
    return { error: "Invalid discount type." };
  }

  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0 ||
    (discountType === "percentage" && discountValue > 100)
  ) {
    return { error: "Enter a valid discount value. Percentage cannot exceed 100." };
  }

  if (!["new", "vip", "both"].includes(customerType)) {
    return { error: "Invalid customer type." };
  }

  if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
    return { error: "Minimum order amount must be zero or greater." };
  }

  if (
    maximumDiscount !== null &&
    (!Number.isFinite(maximumDiscount) || maximumDiscount <= 0)
  ) {
    return { error: "Maximum discount must be greater than zero." };
  }

  if (
    usageLimit !== null &&
    (!Number.isInteger(usageLimit) || usageLimit < 1)
  ) {
    return { error: "Usage limit must be a positive whole number." };
  }

  if (!Number.isInteger(perCustomerLimit) || perCustomerLimit < 1) {
    return { error: "Per-customer limit must be at least 1." };
  }

  const startsAt = body.starts_at
    ? new Date(body.starts_at).toISOString()
    : new Date().toISOString();

  let expiresAt: string | null = null;

  if (body.expires_at) {
    const parsedExpiry = new Date(body.expires_at);

    if (Number.isNaN(parsedExpiry.getTime())) {
      return { error: "Invalid expiry date." };
    }

    expiresAt = parsedExpiry.toISOString();

    if (new Date(expiresAt) <= new Date(startsAt)) {
      return { error: "Expiry date must be later than the start date." };
    }
  }

  if (Number.isNaN(new Date(startsAt).getTime())) {
    return { error: "Invalid start date." };
  }

  return {
    values: {
      code,
      description: description || null,
      discount_type: discountType,
      discount_value: discountValue,
      customer_type: customerType,
      minimum_order_amount: minimumOrderAmount,
      maximum_discount: maximumDiscount,
      usage_limit: usageLimit,
      per_customer_limit: perCustomerLimit,
      starts_at: startsAt,
      expires_at: expiresAt,
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    },
  };
}

// GET: List coupons and redemption counts.
export async function GET(request: Request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const { data: coupons, error } = await supabaseAdmin
      .from("store_coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: redemptions, error: redemptionError } =
      await supabaseAdmin
        .from("store_coupon_redemptions")
        .select("coupon_id");

    if (redemptionError) throw redemptionError;

    const counts = new Map<string, number>();

    for (const redemption of redemptions || []) {
      counts.set(
        redemption.coupon_id,
        (counts.get(redemption.coupon_id) || 0) + 1
      );
    }

    const result = (coupons || []).map((coupon) => ({
      ...coupon,
      used_count: counts.get(coupon.id) || 0,
    }));

    return NextResponse.json({
      success: true,
      coupons: result,
    });
  } catch (error) {
    console.error("Get store coupons error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unable to load coupons.",
      },
      { status: 500 }
    );
  }
}

// POST: Create a coupon.
export async function POST(request: Request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateCoupon(body);

    if ("error" in validation) {
  return NextResponse.json(
    { success: false, error: validation.error },
    { status: 400 }
  );
}

    const { data, error } = await supabaseAdmin
      .from("store_coupons")
      .insert(validation.values)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "This coupon code already exists." },
          { status: 409 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      coupon: data,
      message: "Coupon created successfully.",
    });
  } catch (error) {
    console.error("Create store coupon error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unable to create coupon.",
      },
      { status: 500 }
    );
  }
}

// PATCH: Edit or activate/deactivate a coupon.
export async function PATCH(request: Request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon ID is required." },
        { status: 400 }
      );
    }

    if (typeof body.is_active === "boolean" &&
        Object.keys(body).every((key) => ["id", "is_active"].includes(key))) {
      const { data, error } = await supabaseAdmin
        .from("store_coupons")
        .update({
          is_active: body.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        coupon: data,
        message: "Coupon status updated.",
      });
    }

    const validation = validateCoupon(body);

    if ("error" in validation) {
  return NextResponse.json(
    { success: false, error: validation.error },
    { status: 400 }
  );
}

    const { data, error } = await supabaseAdmin
      .from("store_coupons")
      .update(validation.values)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "This coupon code already exists." },
          { status: 409 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      coupon: data,
      message: "Coupon updated successfully.",
    });
  } catch (error) {
    console.error("Update store coupon error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unable to update coupon.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete only coupons without redemption history.
export async function DELETE(request: Request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon ID is required." },
        { status: 400 }
      );
    }

    const { data: redemption, error: checkError } =
      await supabaseAdmin
        .from("store_coupon_redemptions")
        .select("id")
        .eq("coupon_id", id)
        .limit(1)
        .maybeSingle();

    if (checkError) throw checkError;

    if (redemption) {
      return NextResponse.json(
        {
          success: false,
          error: "This coupon has redemption history. Deactivate it instead of deleting it.",
        },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from("store_coupons")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error("Delete store coupon error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unable to delete coupon.",
      },
      { status: 500 }
    );
  }
}
