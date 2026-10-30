
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

type CartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

type Customer = {
  name: string;
  mobile: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
};

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/* =========================================================
   GET STORE SALES REPORT
========================================================= */

export async function GET(request: Request) {
  try {
    const password =
      request.headers.get("x-admin-password") ||
      request.headers.get("admin-password");

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const {
      data: orders,
      error: ordersError,
    } = await supabaseAdmin
      .from("store_orders")
      .select(`
        id,
        customer_name,
        mobile,
        total_amount,
        status,
        payment_status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Sales orders error:", ordersError);
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    const orderIds = (orders || []).map((order) => order.id);

    let items: Array<{
      id: string;
      order_id: string;
      product_id: string | null;
      product_name: string;
      quantity: number;
      price: number;
      cost_price: number;
      total: number;
      category: string;
    }> = [];

    if (orderIds.length > 0) {
      const {
        data: orderItems,
        error: itemsError,
      } = await supabaseAdmin
        .from("store_order_items")
        .select(`
          id,
          order_id,
          product_id,
          product_name,
          quantity,
          price,
          cost_price,
          total
        `)
        .in("order_id", orderIds);

      if (itemsError) {
        console.error("Sales order items error:", itemsError);
        return NextResponse.json(
          { success: false, error: itemsError.message },
          { status: 500 }
        );
      }

      const loadedItems = orderItems || [];

      const productIds = [
        ...new Set(
          loadedItems
            .map((item) => item.product_id)
            .filter((id): id is string => Boolean(id))
        ),
      ];

      let categoryMap = new Map<string, string>();

      if (productIds.length > 0) {
        const {
          data: products,
          error: productsError,
        } = await supabaseAdmin
          .from("store_products")
          .select("id, category")
          .in("id", productIds);

        if (productsError) {
          console.error("Sales product categories error:", productsError);
          return NextResponse.json(
            { success: false, error: productsError.message },
            { status: 500 }
          );
        }

        categoryMap = new Map(
          (products || []).map((product) => [
            product.id,
            product.category,
          ])
        );
      }

      items = loadedItems.map((item) => ({
        ...item,
        category: item.product_id
          ? categoryMap.get(item.product_id) || "Other"
          : "Other",
      }));
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
      items,
    });
  } catch (error) {
    console.error("Store sales report error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load sales report.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST - CREATE CUSTOMER STORE ORDER
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customer: Customer = body.customer;
    const items: CartItem[] = body.items;
    const totalPrice = Number(body.totalPrice);

    const couponCode =
      typeof body.couponCode === "string"
        ? body.couponCode.trim().toUpperCase()
        : "";

    // Validate customer details
    if (
      !customer ||
      !customer.name ||
      !customer.mobile ||
      !customer.address ||
      !customer.city ||
      !customer.state ||
      !customer.pinCode
    ) {
      return NextResponse.json(
        { error: "Please provide all required customer details." },
        { status: 400 }
      );
    }

    const customerMobile = customer.mobile.trim();

    if (!/^[6-9]\d{9}$/.test(customerMobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Validate cart
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      return NextResponse.json(
        { error: "Invalid order total." },
        { status: 400 }
      );
    }

    const productIds = items.map((item) => item.id).filter(Boolean);

    if (
      productIds.length === 0 ||
      new Set(productIds).size !== productIds.length
    ) {
      return NextResponse.json(
        { error: "Invalid or duplicate products in your cart." },
        { status: 400 }
      );
    }

    // Verify real products and prices from Supabase
    const {
      data: products,
      error: productsError,
    } = await supabaseAdmin
      .from("store_products")
      .select(`
        id,
        name,
        category,
        price,
        cost_price,
        stock,
        is_active
      `)
      .in("id", productIds);

    if (productsError) {
      console.error("Store products error:", productsError);
      return NextResponse.json(
        { error: "Unable to verify products." },
        { status: 500 }
      );
    }

    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products are no longer available." },
        { status: 400 }
      );
    }

    // Calculate subtotal using database prices
    let subtotal = 0;

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);

      if (!product) {
        return NextResponse.json(
          { error: `Product "${item.name}" was not found.` },
          { status: 400 }
        );
      }

      if (!product.is_active) {
        return NextResponse.json(
          { error: `${product.name} is currently unavailable.` },
          { status: 400 }
        );
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for ${product.name}.` },
          { status: 400 }
        );
      }

      if (quantity > product.stock) {
        return NextResponse.json(
          {
            error: `Only ${product.stock} unit(s) of ${product.name} are available.`,
          },
          { status: 400 }
        );
      }

      const productPrice = Number(product.price);

      if (!Number.isFinite(productPrice) || productPrice < 0) {
        return NextResponse.json(
          { error: `Invalid price for ${product.name}.` },
          { status: 400 }
        );
      }

      subtotal += productPrice * quantity;
    }

    subtotal = money(subtotal);

    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "Invalid order subtotal." },
        { status: 400 }
      );
    }

    // Check whether a coupon was supplied
    let couponId: string | null = null;
    let savedCouponCode: string | null = null;
    let discountAmount = 0;

    if (couponCode) {
      if (!/^[A-Z0-9_-]{2,50}$/.test(couponCode)) {
        return NextResponse.json(
          { error: "Please enter a valid coupon code." },
          { status: 400 }
        );
      }

      // Find the coupon
      const {
        data: coupon,
        error: couponError,
      } = await supabaseAdmin
        .from("store_coupons")
        .select(`
          id,
          code,
          description,
          discount_type,
          discount_value,
          customer_type,
          minimum_order_amount,
          maximum_discount,
          usage_limit,
          per_customer_limit,
          starts_at,
          expires_at,
          is_active
        `)
        .eq("code", couponCode)
        .maybeSingle();

      if (couponError) {
        console.error("Coupon lookup error:", couponError);
        return NextResponse.json(
          { error: "Unable to verify coupon." },
          { status: 500 }
        );
      }

      if (!coupon || !coupon.is_active) {
        return NextResponse.json(
          { error: "This coupon is invalid or inactive." },
          { status: 400 }
        );
      }

      const now = Date.now();

      if (
        new Date(coupon.starts_at).getTime() > now ||
        (
          coupon.expires_at &&
          new Date(coupon.expires_at).getTime() < now
        )
      ) {
        return NextResponse.json(
          { error: "This coupon is not currently valid." },
          { status: 400 }
        );
      }

      if (subtotal < Number(coupon.minimum_order_amount || 0)) {
        return NextResponse.json(
          {
            error: `Minimum order amount for this coupon is ₹${coupon.minimum_order_amount}.`,
          },
          { status: 400 }
        );
      }

      // Get the customer's paid store orders
      const {
        data: paidOrders,
        error: paidOrdersError,
      } = await supabaseAdmin
        .from("store_orders")
        .select("id, total_amount")
        .eq("mobile", customerMobile)
        .ilike("payment_status", "paid");

      if (paidOrdersError) {
        console.error("Customer order lookup error:", paidOrdersError);
        return NextResponse.json(
          { error: "Unable to verify customer eligibility." },
          { status: 500 }
        );
      }

      const previousPaidOrders = paidOrders || [];

      const paidOrderCount = previousPaidOrders.length;

      const totalPaidSpend = previousPaidOrders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      );

      const isNewCustomer = paidOrderCount === 0;

      const isVipCustomer =
        paidOrderCount >= 5 && totalPaidSpend > 0;

      const eligibleCustomer =
        coupon.customer_type === "both"
          ? isNewCustomer || isVipCustomer
          : coupon.customer_type === "new"
            ? isNewCustomer
            : coupon.customer_type === "vip"
              ? isVipCustomer
              : false;

      if (!eligibleCustomer) {
        return NextResponse.json(
          {
            error:
              coupon.customer_type === "new"
                ? "This coupon is only available to new customers."
                : coupon.customer_type === "vip"
                  ? "This coupon is only available to VIP customers."
                  : "You are not eligible for this coupon.",
          },
          { status: 400 }
        );
      }

      // Check total coupon usage
      const {
        count: totalRedemptions,
        error: totalRedemptionsError,
      } = await supabaseAdmin
        .from("store_coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);

      if (totalRedemptionsError) {
        console.error("Coupon usage lookup error:", totalRedemptionsError);
        return NextResponse.json(
          { error: "Unable to verify coupon usage." },
          { status: 500 }
        );
      }

      if (
        coupon.usage_limit !== null &&
        (totalRedemptions || 0) >= coupon.usage_limit
      ) {
        return NextResponse.json(
          { error: "This coupon has reached its usage limit." },
          { status: 400 }
        );
      }

      // Check this customer's previous redemptions
      const {
        count: customerRedemptions,
        error: customerRedemptionsError,
      } = await supabaseAdmin
        .from("store_coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("customer_mobile", customerMobile);

      if (customerRedemptionsError) {
        console.error(
          "Customer coupon usage error:",
          customerRedemptionsError
        );

        return NextResponse.json(
          { error: "Unable to verify your coupon usage." },
          { status: 500 }
        );
      }

      if (
        (customerRedemptions || 0) >= coupon.per_customer_limit
      ) {
        return NextResponse.json(
          { error: "You have already used this coupon the maximum number of times." },
          { status: 400 }
        );
      }

      // Calculate discount on the server
      const discountValue = Number(coupon.discount_value);

      if (
        !Number.isFinite(discountValue) ||
        discountValue <= 0
      ) {
        return NextResponse.json(
          { error: "This coupon has an invalid discount." },
          { status: 400 }
        );
      }

      if (coupon.discount_type === "percentage") {
        discountAmount = subtotal * (discountValue / 100);
      } else if (coupon.discount_type === "fixed") {
        discountAmount = discountValue;
      } else {
        return NextResponse.json(
          { error: "This coupon has an unsupported discount type." },
          { status: 400 }
        );
      }

      if (coupon.maximum_discount !== null) {
        discountAmount = Math.min(
          discountAmount,
          Number(coupon.maximum_discount)
        );
      }

      // Discount cannot exceed subtotal
      discountAmount = money(
        Math.min(discountAmount, subtotal)
      );

      if (discountAmount <= 0) {
        return NextResponse.json(
          { error: "This coupon does not provide a valid discount." },
          { status: 400 }
        );
      }

      couponId = coupon.id;
      savedCouponCode = coupon.code;
    }

    const payableTotal = money(subtotal - discountAmount);

    if (payableTotal <= 0) {
      return NextResponse.json(
        { error: "Invalid payable amount." },
        { status: 400 }
      );
    }

    // Create the main order
    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("store_orders")
      .insert({
        customer_name: customer.name.trim(),
        mobile: customerMobile,
        address: customer.address.trim(),
        landmark: customer.landmark?.trim() || null,
        city: customer.city.trim(),
        state: customer.state.trim(),
        pin_code: customer.pinCode.trim(),

        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        coupon_id: couponId,
        coupon_code: savedCouponCode,

        total_amount: payableTotal,
        status: "Pending",
        payment_status: "Pending",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Store order creation error:", orderError);
      return NextResponse.json(
        { error: "Unable to create your order." },
        { status: 500 }
      );
    }

    // Save order items using actual database prices
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.id)!;

      const quantity = Number(item.quantity);
      const price = Number(product.price);

      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity,
        price,
        cost_price: Number(product.cost_price ?? 0),
        total: money(price * quantity),
      };
    });

    const {
      error: itemsError,
    } = await supabaseAdmin
      .from("store_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Store order items error:", itemsError);

      await supabaseAdmin
        .from("store_orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        { error: "Unable to save order items." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: payableTotal,
      subtotal: subtotal,
      discount: discountAmount,
      couponCode: savedCouponCode,
    });

  } catch (error) {
    console.error("Store orders API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the order.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH - UPDATE STORE ORDER STATUS
========================================================= */

export async function PATCH(request: Request) {
  try {
    // Verify admin password
    const password =
      request.headers.get("x-admin-password") ||
      request.headers.get("admin-password");

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin password.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const orderId = body.id || body.orderId;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Packed",
      "Shipped",
      "Completed",
      "Cancelled",
    ];

    const allowedPaymentStatuses = [
      "Pending",
      "Paid",
      "Failed",
    ];

    const updateData: {
      status?: string;
      payment_status?: string;
    } = {};

    if (body.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid order status.",
          },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    if (body.payment_status !== undefined) {
      if (!allowedPaymentStatuses.includes(body.payment_status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid payment status.",
          },
          { status: 400 }
        );
      }

      updateData.payment_status = body.payment_status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No status changes were provided.",
        },
        { status: 400 }
      );
    }

    const { data: updatedOrder, error } = await supabaseAdmin
      .from("store_orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Store order status update error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Store order PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update store order.",
      },
      { status: 500 }
    );
  }
}
