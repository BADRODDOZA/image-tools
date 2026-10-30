
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const adminPassword = process.env.STORE_ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseSecretKey || !adminPassword) {
  throw new Error("Required server environment variables are missing.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey
);

const allowedStatuses = [
  "Pending",
  "Processing",
  "Printed",
  "Shipped",
  "Completed",
  "Cancelled",
  "Rejected",
];
export async function GET(request: Request) {
  try {
    const password = request.headers.get("x-admin-password");

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized admin access." },
        { status: 401 }
      );
    }

    const { data: orders, error: ordersError } =
      await supabaseAdmin
        .from("pvc_orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    const { data: items, error: itemsError } =
      await supabaseAdmin
        .from("pvc_order_items")
        .select(
          "id, order_id, front_document_url, back_document_url, quantity"
        );

    if (itemsError) {
      throw itemsError;
    }

    const ordersWithDocuments = await Promise.all(
      (orders || []).map(async (order) => {
        const orderItems = await Promise.all(
          (items || [])
            .filter((item) => item.order_id === order.id)
            .map(async (item) => {
              let frontSignedUrl: string | null = null;
              let backSignedUrl: string | null = null;

              if (item.front_document_url) {
                const { data, error } = await supabaseAdmin.storage
                  .from("pvc-documents")
                  .createSignedUrl(item.front_document_url, 60 * 10);

                if (error) throw error;

                frontSignedUrl = data.signedUrl;
              }

              if (item.back_document_url) {
                const { data, error } = await supabaseAdmin.storage
                  .from("pvc-documents")
                  .createSignedUrl(item.back_document_url, 60 * 10);

                if (error) throw error;

                backSignedUrl = data.signedUrl;
              }

              return {
                id: item.id,
                order_id: item.order_id,
                quantity: item.quantity,
                front_signed_url: frontSignedUrl,
                back_signed_url: backSignedUrl,
              };
            })
        );

        return {
          ...order,
          pvc_order_items: orderItems,
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: ordersWithDocuments,
    });
  } catch (error) {
    console.error("PVC orders loading error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load PVC orders.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const password = request.headers.get("x-admin-password");

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized admin access." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const orderId = body.orderId || body.id;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid order ID is required." },
        { status: 400 }
      );
    }

    let updateData: {
      status?: string;
      payment_status?: string;
    } = {};

    if (body.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid order status." },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    if (body.paymentStatus !== undefined) {
      const allowedPaymentStatuses = [
        "Pending",
        "Paid",
        "Failed",
      ];

      if (!allowedPaymentStatuses.includes(body.paymentStatus)) {
        return NextResponse.json(
          { success: false, error: "Invalid payment status." },
          { status: 400 }
        );
      }

      updateData.payment_status = body.paymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid update provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("pvc_orders")
      .update(updateData)
      .eq("id", orderId)
      .select("id, status, payment_status")
      .single();

    if (error) {
      console.error("PVC update error:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PVC order updated successfully.",
      order: data,
    });
  } catch (error) {
    console.error("PVC admin API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update PVC order.",
      },
      { status: 500 }
    );
  }
}