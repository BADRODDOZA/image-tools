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

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    const orderId = id?.trim().replace(/^#/, "");

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // GET ORDER
    // --------------------------------------------------

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
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
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Store order error:",
        orderError
      );

      return NextResponse.json(
        {
          error: orderError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // GET ORDER ITEMS
    // --------------------------------------------------

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
      .eq("order_id", orderId)
      .order("id", {
        ascending: true,
      });

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
    // COMBINE ORDER ITEMS + PRODUCT INFORMATION
    // --------------------------------------------------

    const orderItems =
      (items || []).map(
        (item) => {
          const product =
            products.find(
              (product) =>
                product.id ===
                item.product_id
            );

          let imageUrl =
            product?.image_url ||
            null;

          // If image_url is already a complete URL,
          // keep it.
          if (
            imageUrl &&
            imageUrl.startsWith(
              "http"
            )
          ) {
            // Keep existing URL.
          }

          // If image_url contains only the
          // Supabase storage path, create
          // the public URL.
          else if (imageUrl) {
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
              publicUrlData.publicUrl;
          }

          return {
            id: item.id,

            order_id:
              item.order_id,

            product_id:
              item.product_id,

            // Keep original order name
            // if current product no longer exists.
            product_name:
              product?.name ||
              item.product_name,

            // Original ordered quantity.
            quantity:
              item.quantity,

            // Original price paid.
            order_price:
              item.price,

            // Current product price.
            current_price:
              product?.price ??
              item.price,

            // Original total.
            total:
              item.total,

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
        }
      );

    // --------------------------------------------------
    // RETURN ORDER
    // --------------------------------------------------

    return NextResponse.json({
      order: {
        ...order,
        items: orderItems,
      },
    });
  } catch (error) {
    console.error(
      "Order details API error:",
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