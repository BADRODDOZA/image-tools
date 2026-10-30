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

export async function GET() {
  try {
    const now = new Date().toISOString();

    const { data: coupons, error } = await supabaseAdmin
      .from("store_coupons")
      .select(`
        id,
        description,
        discount_type,
        discount_value,
        customer_type,
        minimum_order_amount,
        maximum_discount,
        expires_at
      `)
      .eq("is_active", true)
      .lte("starts_at", now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const { data: redemptions, error: redemptionError } =
      await supabaseAdmin
        .from("store_coupon_redemptions")
        .select("coupon_id");

    if (redemptionError) {
      throw redemptionError;
    }

    const usedCounts = new Map<string, number>();

    for (const redemption of redemptions || []) {
      usedCounts.set(
        redemption.coupon_id,
        (usedCounts.get(redemption.coupon_id) || 0) + 1
      );
    }

    const { data: limits, error: limitsError } =
      await supabaseAdmin
        .from("store_coupons")
        .select("id, usage_limit")
        .eq("is_active", true);

    if (limitsError) {
      throw limitsError;
    }

    const usageLimits = new Map(
      (limits || []).map((coupon) => [
        coupon.id,
        coupon.usage_limit,
      ])
    );

    const availableCoupons = (coupons || []).filter((coupon) => {
      const limit = usageLimits.get(coupon.id);

      if (limit === null || limit === undefined) {
        return true;
      }

      return (usedCounts.get(coupon.id) || 0) < limit;
    });

    return NextResponse.json({
      success: true,
      coupons: availableCoupons,
    });
  } catch (error) {
    console.error("Public coupon list error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load coupon offers.",
      },
      { status: 500 }
    );
  }
}