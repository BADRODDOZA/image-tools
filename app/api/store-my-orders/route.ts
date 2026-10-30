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

const PRODUCT_BUCKET = "store-products";

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const mobile =
      searchParams.get("mobile")?.trim();

    const orderId =
      searchParams
        .get("orderId")
        ?.trim()
        .replace(/^#/, "");

    if (!mobile) {
      return NextResponse.json(
        {
          error:
            "Mobile number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (mobile.length < 10) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // GET ORDERS
    // --------------------------------------------------

    let ordersQuery = supabaseAdmin
      .from("store_orders")
      .select(
        `
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
        `
      )
      .eq("mobile", mobile)
      .order("created_at", {
        ascending: false,
      });

    if (orderId) {
      ordersQuery =
        ordersQuery.eq("id", orderId);
    }

    const {
      data: orders,
      error: ordersError,
    } = await ordersQuery;

    if (ordersError) {
      console.error(
        "Store orders error:",
        ordersError
      );

      return NextResponse.json(
        {
          error: ordersError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        orders: [],
      });
    }

    // --------------------------------------------------
    // GET ORDER ITEMS
    // --------------------------------------------------

    const orderIds = orders.map(
      (order) => order.id
    );

    const {
      data: items,
      error: itemsError,
    } = await supabaseAdmin
      .from("store_order_items")
      .select(
        `
        id,
        order_id,
        product_id,
        product_name,
        quantity,
        price,
        total
        `
      )
      .in("order_id", orderIds);

    if (itemsError) {
      console.error(
        "Store order items error:",
        itemsError
      );

      return NextResponse.json(
        {
          error: itemsError.message,
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // GET CURRENT PRODUCT INFORMATION
    // --------------------------------------------------

    const productIds = Array.from(
      new Set(
        (items || [])
          .map(
            (item) => item.product_id
          )
          .filter(
            (id): id is string =>
              Boolean(id)
          )
      )
    );

    let products: {
      id: string;
      name: string | null;
      category: string | null;
      description: string | null;
      brand: string | null;
      gsm: number | null;
      pack_size: string | null;
      compatibility: string | null;
      price: number | null;
      stock: number | null;
      image_url: string | null;
      is_active: boolean | null;
    }[] = [];

    if (productIds.length > 0) {
      const {
        data: productData,
        error: productsError,
      } = await supabaseAdmin
        .from("store_products")
        .select(
          `
          id,
          name,
          category,
          description,
          brand,
          gsm,
          pack_size,
          compatibility,
          price,
          stock,
          image_url,
          is_active
          `
        )
        .in("id", productIds);

      if (productsError) {
        console.error(
          "Store products error:",
          productsError
        );
      } else {
        products =
          productData || [];
      }
    }

    // --------------------------------------------------
    // ADD CURRENT PRODUCT DATA TO ORDER ITEMS
    // --------------------------------------------------

    const ordersWithItems =
      orders.map((order) => {
        const orderItems =
          (items || [])
            .filter(
              (item) =>
                item.order_id ===
                order.id
            )
            .map((item) => {
              const product =
                products.find(
                  (product) =>
                    product.id ===
                    item.product_id
                );

              // ----------------------------------------
              // PRODUCT IMAGE
              // ----------------------------------------

              let imageUrl =
                product?.image_url ||
                null;

              if (
                imageUrl &&
                imageUrl.startsWith(
                  "http"
                )
              ) {
                // Already a complete URL.
              } else if (imageUrl) {
                const {
                  data:
                    publicUrlData,
                } =
                  supabaseAdmin.storage
                    .from(
                      PRODUCT_BUCKET
                    )
                    .getPublicUrl(
                      imageUrl
                    );

                imageUrl =
                  publicUrlData
                    .publicUrl;
              }

              // ----------------------------------------
              // RETURN ITEM
              // ----------------------------------------

              return {
                id: item.id,

                order_id:
                  item.order_id,

                product_id:
                  item.product_id,

                // Current product name if available
                product_name:
                  product?.name ||
                  item.product_name,

                // Original ordered quantity
                quantity:
                  item.quantity,

                // Current product price
                current_price:
                  product?.price ??
                  item.price,

                // Original order price
                order_price:
                  item.price,

                // Original item total
                total:
                  item.total,

                // Current product information
                category:
                  product?.category ||
                  null,

                description:
                  product?.description ||
                  null,

                brand:
                  product?.brand ||
                  null,

                gsm:
                  product?.gsm ??
                  null,

                pack_size:
                  product?.pack_size ||
                  null,

                compatibility:
                  product?.compatibility ||
                  null,

                stock:
                  product?.stock ??
                  0,

                image_url:
                  imageUrl,

                is_active:
                  product?.is_active ??
                  false,

                product_exists:
                  Boolean(product),
              };
            });

        return {
          ...order,
          items: orderItems,
        };
      });

    // --------------------------------------------------
    // RETURN RESPONSE
    // --------------------------------------------------

    return NextResponse.json({
      orders:
        ordersWithItems,
    });
  } catch (error) {
    console.error(
      "My orders API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}