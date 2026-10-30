import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  process.env.STORE_ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Supabase server environment variables are missing."
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey
);

function isAuthenticated(request: Request) {
  const password =
    request.headers.get("x-admin-password") ||
    request.headers.get("admin-password");

  return (
    !!ADMIN_PASSWORD &&
    password === ADMIN_PASSWORD
  );
}

export async function GET(request: Request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // PRODUCTS
    // --------------------------------------------------

    const {
      data: products,
      error: productsError,
    } = await supabaseAdmin
      .from("store_products")
      .select(
        "id, stock, is_active"
      );

    if (productsError) {
      console.error(
        "Dashboard products error:",
        productsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load product statistics.",
        },
        { status: 500 }
      );
    }

    const productList =
      products || [];

    const totalProducts =
      productList.length;

    const activeProducts =
      productList.filter(
        (product) =>
          product.is_active === true
      ).length;

    const lowStockProducts =
      productList.filter(
        (product) =>
          product.is_active === true &&
          Number(product.stock) >= 1 &&
          Number(product.stock) <= 5
      ).length;

    const outOfStockProducts =
      productList.filter(
        (product) =>
          product.is_active === true &&
          Number(product.stock) <= 0
      ).length;

    // --------------------------------------------------
    // ORDERS
    // --------------------------------------------------

    const {
      data: orders,
      error: ordersError,
    } = await supabaseAdmin
      .from("store_orders")
      .select(
        `
        id,
        customer_name,
        mobile,
        total_amount,
        status,
        payment_status,
        created_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (ordersError) {
      console.error(
        "Dashboard orders error:",
        ordersError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load order statistics.",
        },
        { status: 500 }
      );
    }

    const orderList =
      orders || [];

    // --------------------------------------------------
    // ORDER COUNTS
    // --------------------------------------------------

    const totalOrders =
      orderList.length;

    const pendingOrders =
      orderList.filter(
        (order) =>
          String(order.status)
            .toLowerCase() ===
          "pending"
      ).length;

    const processingOrders =
      orderList.filter(
        (order) =>
          String(order.status)
            .toLowerCase() ===
          "processing"
      ).length;

    const packedOrders =
      orderList.filter(
        (order) =>
          String(order.status)
            .toLowerCase() ===
          "packed"
      ).length;

    const shippedOrders =
      orderList.filter(
        (order) =>
          String(order.status)
            .toLowerCase() ===
          "shipped"
      ).length;

    const completedOrders =
      orderList.filter(
        (order) =>
          String(order.status)
            .toLowerCase() ===
          "completed"
      ).length;

    const cancelledOrders =
      orderList.filter(
        (order) =>
          String(order.status)
            .toLowerCase() ===
          "cancelled"
      ).length;

    // --------------------------------------------------
    // SALES
    // --------------------------------------------------

    const totalSales =
      orderList.reduce(
        (sum, order) =>
          sum +
          Number(
            order.total_amount || 0
          ),
        0
      );

    const paidSales =
      orderList
        .filter(
          (order) =>
            String(
              order.payment_status || ""
            ).toLowerCase() ===
            "paid"
        )
        .reduce(
          (sum, order) =>
            sum +
            Number(
              order.total_amount || 0
            ),
          0
        );

    // --------------------------------------------------
    // RECENT ORDERS
    // --------------------------------------------------

    const recentOrders =
      orderList
        .slice(0, 10)
        .map((order) => ({
          id: order.id,
          customer_name:
            order.customer_name,
          mobile: order.mobile,
          total_amount:
            Number(
              order.total_amount || 0
            ),
          status:
            order.status || "Pending",
          payment_status:
            order.payment_status ||
            "Pending",
          created_at:
            order.created_at,
        }));

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      dashboard: {
        products: {
          total:
            totalProducts,

          active:
            activeProducts,

          lowStock:
            lowStockProducts,

          outOfStock:
            outOfStockProducts,
        },

        orders: {
          total:
            totalOrders,

          pending:
            pendingOrders,

          processing:
            processingOrders,

          packed:
            packedOrders,

          shipped:
            shippedOrders,

          completed:
            completedOrders,

          cancelled:
            cancelledOrders,
        },

        sales: {
          total:
            Math.round(
              totalSales * 100
            ) / 100,

          paid:
            Math.round(
              paidSales * 100
            ) / 100,
        },

        recentOrders,
      },
    });
  } catch (error) {
    console.error(
      "Store dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load store dashboard.",
      },
      { status: 500 }
    );
  }
}