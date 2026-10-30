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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customer: Customer = body.customer;
    const items: CartItem[] = body.items;

    // --------------------------------------------------
    // VALIDATE CUSTOMER
    // --------------------------------------------------

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
        {
          success: false,
          error:
            "Please provide all required customer details.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // VALIDATE CART
    // --------------------------------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // GET PRODUCT IDS
    // --------------------------------------------------

    const productIds = items
      .map((item) => item.id)
      .filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid products found.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // GET REAL PRODUCT DATA FROM SUPABASE
    // --------------------------------------------------

    const {
      data: products,
      error: productsError,
    } = await supabaseAdmin
      .from("store_products")
      .select(
        `
        id,
        name,
        category,
        price,
        stock,
        is_active
        `
      )
      .in("id", productIds);

    if (productsError) {
      console.error(
        "Store products lookup error:",
        productsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify products.",
        },
        { status: 500 }
      );
    }

    if (
      !products ||
      products.length !== productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more products are no longer available.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // CHECK PRODUCTS AND CALCULATE REAL TOTAL
    // --------------------------------------------------

    let calculatedTotal = 0;

    for (const item of items) {
      const product = products.find(
        (product) =>
          product.id === item.id
      );

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Product "${item.name}" was not found.`,
          },
          { status: 400 }
        );
      }

      // Product must be active
      if (!product.is_active) {
        return NextResponse.json(
          {
            success: false,
            error:
              `${product.name} is currently unavailable.`,
          },
          { status: 400 }
        );
      }

      const quantity =
        Number(item.quantity);

      // Quantity must be a positive integer
      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Invalid quantity for ${product.name}.`,
          },
          { status: 400 }
        );
      }

      // Check current stock
      if (
        quantity >
        Number(product.stock)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Only ${product.stock} unit(s) of ${product.name} are available.`,
          },
          { status: 400 }
        );
      }

      // IMPORTANT:
      // Use price from Supabase, NOT price from browser.
      calculatedTotal +=
        Number(product.price) *
        quantity;
    }

    calculatedTotal =
      Math.round(
        calculatedTotal * 100
      ) / 100;

    // --------------------------------------------------
    // CREATE STORE ORDER
    // --------------------------------------------------

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("store_orders")
      .insert({
        customer_name:
          customer.name.trim(),

        mobile:
          customer.mobile.trim(),

        address:
          customer.address.trim(),

        landmark:
          customer.landmark?.trim() ||
          "",

        city:
          customer.city.trim(),

        state:
          customer.state.trim(),

        pin_code:
          customer.pinCode.trim(),

        total_amount:
          calculatedTotal,

        status: "Pending",

        payment_status: "Pending",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error(
        "Store order insert error:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to create your order.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // CREATE ORDER ITEMS
    // --------------------------------------------------

    const orderItems = items.map(
      (item) => {
        const product =
          products.find(
            (product) =>
              product.id === item.id
          )!;

        const quantity =
          Number(item.quantity);

        const price =
          Number(product.price);

        const total =
          Math.round(
            price * quantity * 100
          ) / 100;

        return {
          order_id: order.id,

          product_id:
            product.id,

          product_name:
            product.name,

          quantity,

          price,

          total,
        };
      }
    );

    const {
      error: itemsError,
    } = await supabaseAdmin
      .from("store_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error(
        "Store order items insert error:",
        itemsError
      );

      // Delete incomplete order
      await supabaseAdmin
        .from("store_orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to save order items.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // RETURN ORDER INFORMATION
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      orderId: order.id,

      // This is the REAL amount from the database.
      amount: calculatedTotal,
    });
  } catch (error) {
    console.error(
      "Store checkout error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not create your order.",
      },
      { status: 500 }
    );
  }
}