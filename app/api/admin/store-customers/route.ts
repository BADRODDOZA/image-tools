
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

type StoreOrder = {
  id: string;
  customer_name: string | null;
  mobile: string | null;
  address: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  total_amount: number | string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
};

type CustomerRecord = {
  customer_key: string;
  customer_name: string;
  mobile: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pin_code: string;
  total_orders: number;
  paid_orders: number;
  total_spent: number;
  first_purchase: string;
  last_purchase: string;
  orders: {
    id: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
  }[];
};

export async function GET(request: Request) {
  try {
    // Admin authentication
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

    // Fetch all store orders
    const { data: orders, error } = await supabaseAdmin
      .from("store_orders")
      .select(`
        id,
        customer_name,
        mobile,
        address,
        landmark,
        city,
        state,
        pin_code,
        total_amount,
        status,
        payment_status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Customer orders error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Group orders by customer mobile number
    const customers = new Map<string, CustomerRecord>();

    for (const order of (orders || []) as StoreOrder[]) {
      const mobile = String(order.mobile || "").trim();
      const name = String(
        order.customer_name || "Customer"
      ).trim();

      // Mobile number identifies the customer.
      // Orders without a mobile number stay separate.
      const customerKey = mobile
        ? mobile.replace(/\s+/g, "")
        : `order-${order.id}`;

      const amount = Number(order.total_amount || 0);

      const isPaid =
        String(order.payment_status || "").toLowerCase() === "paid";

      const orderDetails = {
        id: order.id,
        total_amount: amount,
        status: order.status || "Unknown",
        payment_status: order.payment_status || "Unknown",
        created_at: order.created_at,
      };

      const existing = customers.get(customerKey);

      if (existing) {
        existing.total_orders += 1;

        if (isPaid) {
          existing.paid_orders += 1;
          existing.total_spent += amount;
        }

        if (
          new Date(order.created_at).getTime() <
          new Date(existing.first_purchase).getTime()
        ) {
          existing.first_purchase = order.created_at;
        }

        if (
          new Date(order.created_at).getTime() >
          new Date(existing.last_purchase).getTime()
        ) {
          existing.last_purchase = order.created_at;
        }

        existing.orders.push(orderDetails);
      } else {
        customers.set(customerKey, {
          customer_key: customerKey,
          customer_name: name,
          mobile,
          address: String(order.address || ""),
          landmark: String(order.landmark || ""),
          city: String(order.city || ""),
          state: String(order.state || ""),
          pin_code: String(order.pin_code || ""),
          total_orders: 1,
          paid_orders: isPaid ? 1 : 0,
          total_spent: isPaid ? amount : 0,
          first_purchase: order.created_at,
          last_purchase: order.created_at,
          orders: [orderDetails],
        });
      }
    }

    // Prepare customer list
    const customerList = Array.from(customers.values())
      .map((customer) => ({
        ...customer,

        total_spent:
          Math.round(customer.total_spent * 100) / 100,

        orders: customer.orders.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.last_purchase).getTime() -
          new Date(a.last_purchase).getTime()
      );

    // Dashboard statistics
    const totalCustomers = customerList.length;

    const repeatCustomers = customerList.filter(
      (customer) => customer.total_orders > 1
    ).length;

    const totalPaidRevenue = customerList.reduce(
      (sum, customer) => sum + customer.total_spent,
      0
    );

    const averageCustomerSpend =
      totalCustomers > 0
        ? totalPaidRevenue / totalCustomers
        : 0;

    return NextResponse.json({
      success: true,

      customers: customerList,

      summary: {
        total_customers: totalCustomers,
        repeat_customers: repeatCustomers,

        total_paid_revenue:
          Math.round(totalPaidRevenue * 100) / 100,

        average_customer_spend:
          Math.round(averageCustomerSpend * 100) / 100,
      },
    });

  } catch (error) {
    console.error("Store customers API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load customer records.",
      },
      { status: 500 }
    );
  }
}
