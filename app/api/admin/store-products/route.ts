
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const adminPassword =
  process.env.ADMIN_PASSWORD ||
  process.env.STORE_ADMIN_PASSWORD;

const PRODUCT_BUCKET = "store-products";

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

  if (!adminPassword) {
    console.error(
      "ADMIN_PASSWORD or STORE_ADMIN_PASSWORD is not configured."
    );

    return false;
  }

  return password === adminPassword;
}

function getFileExtension(file: File) {
  const name = file.name || "";
  const extension = name.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return mimeMap[file.type] || "jpg";
}

async function deleteStorageImage(imageUrl: string | null) {
  if (!imageUrl) return;

  try {
    const marker =
      `/storage/v1/object/public/${PRODUCT_BUCKET}/`;

    const index = imageUrl.indexOf(marker);

    if (index === -1) return;

    const filePath = decodeURIComponent(
      imageUrl.substring(index + marker.length)
    );

    if (!filePath) return;

    const { error } = await supabaseAdmin.storage
      .from(PRODUCT_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Storage image delete error:", error);
    }
  } catch (error) {
    console.error("Unable to delete storage image:", error);
  }
}

function validateReorderSettings(
  reorderLevel: number,
  targetStock: number
) {
  if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
    return "Reorder level must be a whole number greater than or equal to 0.";
  }

  if (
    !Number.isInteger(targetStock) ||
    targetStock < 0 ||
    targetStock < reorderLevel
  ) {
    return "Target stock must be a whole number and cannot be lower than the reorder level.";
  }

  return null;
}

/* =========================================================
   GET PRODUCTS AND PRICE HISTORY
========================================================= */

export async function GET(request: Request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const priceHistory = searchParams.get("priceHistory");

    if (priceHistory) {
      let historyQuery = supabaseAdmin
        .from("store_product_price_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (priceHistory !== "all") {
        historyQuery = historyQuery.eq("product_id", priceHistory);
      }

      const { data, error } = await historyQuery;

      if (error) {
        console.error("Price history error:", error);

        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        history: data || [],
      });
    }

    const { data, error } = await supabaseAdmin
      .from("store_products")
      .select(`
        id,
        name,
        category,
        description,
        brand,
        gsm,
        pack_size,
        compatibility,
        price,
        cost_price,
        stock,
        reorder_level,
        target_stock,
        image_url,
        is_active,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get store products error:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data || [],
    });
  } catch (error) {
    console.error("Store products GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load products.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   - ADMIN LOGIN
   - CREATE PRODUCT
========================================================= */

export async function POST(request: Request) {
  try {
    const contentType =
      request.headers.get("content-type") || "";

    // ADMIN LOGIN
    if (contentType.includes("application/json")) {
      const body = await request.json();

      const password =
        typeof body?.password === "string"
          ? body.password
          : "";

      if (!adminPassword || password !== adminPassword) {
        return NextResponse.json(
          { success: false, error: "Invalid admin password." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        message: "Login successful.",
      });
    }

    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const brand = String(formData.get("brand") || "").trim();
    const gsmValue = String(formData.get("gsm") || "").trim();
    const packSize = String(formData.get("pack_size") || "").trim();
    const compatibility = String(formData.get("compatibility") || "").trim();
    const priceValue = String(formData.get("price") || "").trim();
    const costPriceValue = String(formData.get("cost_price") ?? "0").trim();
    const stockValue = String(formData.get("stock") || "").trim();

    const reorderLevelValue = String(
      formData.get("reorder_level") ?? "5"
    ).trim();

    const targetStockValue = String(
      formData.get("target_stock") ?? "20"
    ).trim();

    const isActiveValue = String(
      formData.get("is_active") ?? "true"
    ).trim();

    const image = formData.get("image");

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Product name is required." },
        { status: 400 }
      );
    }

    if (category !== "A4 Paper" && category !== "Printer Ink") {
      return NextResponse.json(
        {
          success: false,
          error: "Category must be A4 Paper or Printer Ink.",
        },
        { status: 400 }
      );
    }

    const price = Number(priceValue);
    const costPrice = Number(costPriceValue);
    const stock = Number(stockValue);
    const reorderLevel = Number(reorderLevelValue);
    const targetStock = Number(targetStockValue);

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid price." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(costPrice) || costPrice < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid purchase cost.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock must be a whole number greater than or equal to 0.",
        },
        { status: 400 }
      );
    }

    const reorderError = validateReorderSettings(
      reorderLevel,
      targetStock
    );

    if (reorderError) {
      return NextResponse.json(
        { success: false, error: reorderError },
        { status: 400 }
      );
    }

    let gsm: number | null = null;

    if (gsmValue) {
      const parsedGsm = Number(gsmValue);

      if (!Number.isFinite(parsedGsm) || parsedGsm < 0) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid GSM." },
          { status: 400 }
        );
      }

      gsm = parsedGsm;
    }

    let imageUrl: string | null = null;

    // IMAGE UPLOAD
    if (image instanceof File && image.size > 0) {
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "Image must be smaller than 5 MB." },
          { status: 400 }
        );
      }

      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Please upload a valid image file.",
          },
          { status: 400 }
        );
      }

      const extension = getFileExtension(image);
      const filePath =
        `products/${randomUUID()}-${Date.now()}.${extension}`;

      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(PRODUCT_BUCKET)
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Product image upload error:", uploadError);

        return NextResponse.json(
          {
            success: false,
            error: "Unable to upload product image.",
          },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(PRODUCT_BUCKET)
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    // INSERT PRODUCT
    const { data, error } = await supabaseAdmin
      .from("store_products")
      .insert({
        name,
        category,
        description: description || null,
        brand: brand || null,
        gsm,
        pack_size: packSize || null,
        compatibility: compatibility || null,
        price,
        cost_price: costPrice,
        stock,
        reorder_level: reorderLevel,
        target_stock: targetStock,
        image_url: imageUrl,
        is_active: isActiveValue !== "false",
      })
      .select(`
        id,
        name,
        category,
        description,
        brand,
        gsm,
        pack_size,
        compatibility,
        price,
        cost_price,
        stock,
        reorder_level,
        target_stock,
        image_url,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error("Create store product error:", error);

      if (imageUrl) {
        await deleteStorageImage(imageUrl);
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    console.error("Store product POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to process request.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH - UPDATE PRODUCT
========================================================= */

export async function PATCH(request: Request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const id = String(formData.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required." },
        { status: 400 }
      );
    }

    // GET CURRENT PRODUCT
    const { data: existingProduct, error: existingError } =
      await supabaseAdmin
        .from("store_products")
        .select(`
          id,
          name,
          category,
          description,
          brand,
          gsm,
          pack_size,
          compatibility,
          price,
          cost_price,
          stock,
          reorder_level,
          target_stock,
          image_url,
          is_active
        `)
        .eq("id", id)
        .maybeSingle();

    if (existingError) {
      console.error("Existing product lookup error:", existingError);

      return NextResponse.json(
        { success: false, error: "Unable to find the product." },
        { status: 500 }
      );
    }

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    const name = String(
      formData.get("name") ?? existingProduct.name
    ).trim();

    const category = String(
      formData.get("category") ?? existingProduct.category
    ).trim();

    const description = String(
      formData.get("description") ?? existingProduct.description ?? ""
    ).trim();

    const brand = String(
      formData.get("brand") ?? existingProduct.brand ?? ""
    ).trim();

    const gsmValue = String(
      formData.get("gsm") ?? existingProduct.gsm ?? ""
    ).trim();

    const packSize = String(
      formData.get("pack_size") ?? existingProduct.pack_size ?? ""
    ).trim();

    const compatibility = String(
      formData.get("compatibility") ??
        existingProduct.compatibility ??
        ""
    ).trim();

    const priceValue = String(
      formData.get("price") ?? existingProduct.price
    ).trim();

    const costPriceValue = String(
      formData.get("cost_price") ?? existingProduct.cost_price ?? 0
    ).trim();

    const stockValue = String(
      formData.get("stock") ?? existingProduct.stock
    ).trim();

    const reorderLevelValue = String(
      formData.get("reorder_level") ??
        existingProduct.reorder_level ??
        5
    ).trim();

    const targetStockValue = String(
      formData.get("target_stock") ??
        existingProduct.target_stock ??
        20
    ).trim();

    const isActiveValue = String(
      formData.get("is_active") ?? String(existingProduct.is_active)
    ).trim();

    const image = formData.get("image");

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Product name is required." },
        { status: 400 }
      );
    }

    if (category !== "A4 Paper" && category !== "Printer Ink") {
      return NextResponse.json(
        {
          success: false,
          error: "Category must be A4 Paper or Printer Ink.",
        },
        { status: 400 }
      );
    }

    const price = Number(priceValue);
    const costPrice = Number(costPriceValue);
    const stock = Number(stockValue);
    const reorderLevel = Number(reorderLevelValue);
    const targetStock = Number(targetStockValue);

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid price." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(costPrice) || costPrice < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid purchase cost.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock must be a whole number greater than or equal to 0.",
        },
        { status: 400 }
      );
    }

    const reorderError = validateReorderSettings(
      reorderLevel,
      targetStock
    );

    if (reorderError) {
      return NextResponse.json(
        { success: false, error: reorderError },
        { status: 400 }
      );
    }

    let gsm: number | null = null;

    if (gsmValue) {
      const parsedGsm = Number(gsmValue);

      if (!Number.isFinite(parsedGsm) || parsedGsm < 0) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid GSM." },
          { status: 400 }
        );
      }

      gsm = parsedGsm;
    }

    let imageUrl = existingProduct.image_url;
    let newImageUploaded = false;

    // NEW IMAGE UPLOAD
    if (image instanceof File && image.size > 0) {
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "Image must be smaller than 5 MB." },
          { status: 400 }
        );
      }

      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Please upload a valid image file.",
          },
          { status: 400 }
        );
      }

      const extension = getFileExtension(image);
      const filePath =
        `products/${randomUUID()}-${Date.now()}.${extension}`;

      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(PRODUCT_BUCKET)
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(
          "Updated product image upload error:",
          uploadError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to upload new product image.",
          },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(PRODUCT_BUCKET)
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
      newImageUploaded = true;
    }

    // UPDATE PRODUCT
    const { data, error } = await supabaseAdmin
      .from("store_products")
      .update({
        name,
        category,
        description: description || null,
        brand: brand || null,
        gsm,
        pack_size: packSize || null,
        compatibility: compatibility || null,
        price,
        cost_price: costPrice,
        stock,
        reorder_level: reorderLevel,
        target_stock: targetStock,
        image_url: imageUrl,
        is_active: isActiveValue !== "false",
      })
      .eq("id", id)
      .select(`
        id,
        name,
        category,
        description,
        brand,
        gsm,
        pack_size,
        compatibility,
        price,
        cost_price,
        stock,
        reorder_level,
        target_stock,
        image_url,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error("Update store product error:", error);

      if (newImageUploaded && imageUrl) {
        await deleteStorageImage(imageUrl);
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // SAVE PRODUCT PRICE HISTORY
    const oldPrice = Number(existingProduct.price);
    const priceChanged = oldPrice !== price;

    if (priceChanged) {
      const updateSource = String(
        formData.get("price_update_source") || "individual"
      );

      const changeType =
        updateSource === "bulk" ? "bulk" : "individual";

      const { error: historyError } = await supabaseAdmin
        .from("store_product_price_history")
        .insert({
          product_id: id,
          product_name: name,
          old_price: oldPrice,
          new_price: price,
          change_type: changeType,
        });

      if (historyError) {
        console.error(
          "Product price history save error:",
          historyError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Product price was updated, but its price history could not be saved. Please check the price history table.",
          },
          { status: 500 }
        );
      }
    }

    // DELETE OLD IMAGE
    if (
      newImageUploaded &&
      existingProduct.image_url &&
      existingProduct.image_url !== imageUrl
    ) {
      await deleteStorageImage(existingProduct.image_url);
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    console.error("Store product PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update product.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE PRODUCT
========================================================= */

export async function DELETE(request: Request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const contentType =
      request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Delete request must contain JSON.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const id =
      typeof body?.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required." },
        { status: 400 }
      );
    }

    // FIND PRODUCT
    const { data: product, error: productError } =
      await supabaseAdmin
        .from("store_products")
        .select(`
          id,
          name,
          image_url,
          is_active
        `)
        .eq("id", id)
        .maybeSingle();

    if (productError) {
      console.error("Delete product lookup error:", productError);

      return NextResponse.json(
        { success: false, error: "Unable to find the product." },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    // CHECK ORDER HISTORY
    const { data: orderItems, error: orderItemsError } =
      await supabaseAdmin
        .from("store_order_items")
        .select("id")
        .eq("product_id", id)
        .limit(1);

    if (orderItemsError) {
      console.error(
        "Product order history check error:",
        orderItemsError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to check product order history.",
        },
        { status: 500 }
      );
    }

    const hasOrderHistory =
      Array.isArray(orderItems) && orderItems.length > 0;

    // HIDE PRODUCT IF IT HAS PREVIOUS ORDERS
    if (hasOrderHistory) {
      const { data, error } = await supabaseAdmin
        .from("store_products")
        .update({ is_active: false })
        .eq("id", id)
        .select(`
          id,
          name,
          category,
          description,
          brand,
          gsm,
          pack_size,
          compatibility,
          price,
          cost_price,
          stock,
          reorder_level,
          target_stock,
          image_url,
          is_active
        `)
        .single();

      if (error) {
        console.error("Product deactivation error:", error);

        return NextResponse.json(
          {
            success: false,
            error: "Unable to deactivate this product.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        deactivated: true,
        product: data,
        message:
          "This product has previous orders, so it was hidden instead of permanently deleted.",
      });
    }

    // DELETE PRODUCT IF IT HAS NO ORDER HISTORY
    const { error: deleteError } = await supabaseAdmin
      .from("store_products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete store product error:", deleteError);

      return NextResponse.json(
        { success: false, error: "Unable to delete product." },
        { status: 500 }
      );
    }

    // DELETE IMAGE
    if (product.image_url) {
      await deleteStorageImage(product.image_url);
    }

    return NextResponse.json({
      success: true,
      deleted: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Store product DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete product.",
      },
      { status: 500 }
    );
  }
}
