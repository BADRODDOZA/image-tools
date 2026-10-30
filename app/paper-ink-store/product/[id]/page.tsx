"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type StoreProduct = {
  id: string;
  name: string;
  category: "A4 Paper" | "Printer Ink";
  description: string | null;
  brand: string | null;
  gsm: number | null;
  pack_size: string | null;
  compatibility: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
};

type CartItem = {
  id: string;
  name: string;
  category: "A4 Paper" | "Printer Ink";
  price: number;
  stock: number;
  pack_size: string | null;
  gsm: number | null;
  quantity: number;
};

function normalizeCategory(
  category: string | null
): "A4 Paper" | "Printer Ink" {
  if (
    category?.toLowerCase() === "printer ink"
  ) {
    return "Printer Ink";
  }

  return "A4 Paper";
}

function getStockText(stock: number) {
  if (stock <= 0) {
    return "Out of Stock";
  }

  if (stock <= 5) {
    return `Only ${stock} left`;
  }

  return "In Stock";
}

function getStockColor(stock: number) {
  if (stock <= 0) {
    return "#dc2626";
  }

  if (stock <= 5) {
    return "#d97706";
  }

  return "#15803d";
}

function getStockBackground(stock: number) {
  if (stock <= 0) {
    return "#fef2f2";
  }

  if (stock <= 5) {
    return "#fffbeb";
  }

  return "#f0fdf4";
}

function getCart(): CartItem[] {
  try {
    const savedCart =
      localStorage.getItem(
        "paperInkCart"
      );

    if (!savedCart) {
      return [];
    }

    const parsed = JSON.parse(
      savedCart
    );

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(
    "paperInkCart",
    JSON.stringify(cart)
  );

  window.dispatchEvent(
    new Event(
      "paperInkCartUpdated"
    )
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;

  const productId = Array.isArray(rawId)
    ? rawId[0]
    : rawId;

  const cleanProductId =
    String(productId || "").trim();

  const [product, setProduct] =
    useState<StoreProduct | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [cartCount, setCartCount] =
    useState(0);

  const [message, setMessage] =
    useState("");

  const [addingToCart, setAddingToCart] =
    useState(false);

  const [buyingNow, setBuyingNow] =
    useState(false);

  function updateCartCount() {
    const cart = getCart();

    const count = cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );

    setCartCount(count);
  }

  async function loadProduct() {
    if (!cleanProductId) {
      setError(
        "Product ID is missing."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: supabaseError,
      } = await supabase
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
        .eq("id", cleanProductId)
        .maybeSingle();

      if (supabaseError) {
        console.error(
          "Product loading error:",
          supabaseError
        );

        throw new Error(
          "Unable to load product."
        );
      }

      if (!data) {
        throw new Error(
          "Product not found."
        );
      }

      const loadedProduct: StoreProduct = {
        id: data.id,
        name: data.name,
        category:
          normalizeCategory(
            data.category
          ),
        description:
          data.description ?? null,
        brand:
          data.brand ?? null,
        gsm:
          data.gsm !== null
            ? Number(data.gsm)
            : null,
        pack_size:
          data.pack_size ?? null,
        compatibility:
          data.compatibility ?? null,
        price:
          Number(data.price),
        stock:
          Number(data.stock || 0),
        image_url:
          data.image_url ?? null,
        is_active:
          Boolean(data.is_active),
      };

      setProduct(
        loadedProduct
      );

      if (
        loadedProduct.stock <= 0 ||
        !loadedProduct.is_active
      ) {
        setQuantity(0);
      } else {
        setQuantity((current) =>
          Math.min(
            Math.max(current, 1),
            loadedProduct.stock
          )
        );
      }
    } catch (err) {
      console.error(
        "Product loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load product."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    updateCartCount();
    loadProduct();

    function handleCartUpdate() {
      updateCartCount();
    }

    window.addEventListener(
      "paperInkCartUpdated",
      handleCartUpdate
    );

    window.addEventListener(
      "storage",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "paperInkCartUpdated",
        handleCartUpdate
      );

      window.removeEventListener(
        "storage",
        handleCartUpdate
      );
    };
  }, [cleanProductId]);

  function decreaseQuantity() {
    if (!product) {
      return;
    }

    setQuantity((current) =>
      Math.max(1, current - 1)
    );

    setMessage("");
  }

  function increaseQuantity() {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      return;
    }

    setQuantity((current) =>
      Math.min(
        product.stock,
        current + 1
      )
    );

    setMessage("");
  }

  function handleQuantityInput(
    value: string
  ) {
    if (!product) {
      return;
    }

    const parsed =
      Number(value);

    if (
      !Number.isFinite(parsed) ||
      parsed <= 0
    ) {
      setQuantity(1);
      return;
    }

    const newQuantity =
      Math.floor(parsed);

    setQuantity(
      Math.min(
        product.stock,
        Math.max(1, newQuantity)
      )
    );

    setMessage("");
  }

  function buildCartItem(
    productData: StoreProduct,
    selectedQuantity: number
  ): CartItem {
    return {
      id: productData.id,
      name: productData.name,
      category:
        productData.category,
      price:
        Number(productData.price),
      stock:
        Number(productData.stock),
      pack_size:
        productData.pack_size,
      gsm:
        productData.gsm,
      quantity:
        selectedQuantity,
    };
  }

  function addProductToCart(
    goToCart: boolean
  ) {
    if (!product) {
      return;
    }

    setMessage("");
    setError("");

    if (!product.is_active) {
      setError(
        "This product is currently unavailable."
      );
      return;
    }

    if (product.stock <= 0) {
      setError(
        "This product is currently out of stock."
      );
      return;
    }

    const safeQuantity =
      Math.min(
        Math.max(
          1,
          Math.floor(quantity)
        ),
        product.stock
      );

    if (
      safeQuantity !== quantity
    ) {
      setQuantity(
        safeQuantity
      );
    }

    const cart = getCart();

    const existingIndex =
      cart.findIndex(
        (item) =>
          item.id === product.id
      );

    if (existingIndex >= 0) {
      const existing =
        cart[existingIndex];

      const requestedTotal =
        Number(existing.quantity || 0) +
        safeQuantity;

      const newQuantity =
        Math.min(
          requestedTotal,
          product.stock
        );

      cart[existingIndex] =
        buildCartItem(
          product,
          newQuantity
        );

      if (
        requestedTotal >
        product.stock
      ) {
        setMessage(
          `Only ${product.stock} unit(s) are available. Your cart quantity has been limited to ${product.stock}.`
        );
      } else {
        setMessage(
          "✅ Product quantity updated in your cart."
        );
      }
    } else {
      cart.push(
        buildCartItem(
          product,
          safeQuantity
        )
      );

      setMessage(
        "✅ Product added to cart."
      );
    }

    saveCart(cart);
    updateCartCount();

    if (goToCart) {
      router.push(
        "/paper-ink-store/cart"
      );
    }
  }

  function handleAddToCart() {
    if (addingToCart) {
      return;
    }

    setAddingToCart(true);

    try {
      addProductToCart(false);
    } finally {
      setAddingToCart(false);
    }
  }

  function handleBuyNow() {
    if (buyingNow) {
      return;
    }

    if (!product) {
      return;
    }

    if (!product.is_active) {
      setError(
        "This product is currently unavailable."
      );
      return;
    }

    if (product.stock <= 0) {
      setError(
        "This product is currently out of stock."
      );
      return;
    }

    setBuyingNow(true);

    try {
      addProductToCart(true);
    } finally {
      setBuyingNow(false);
    }
  }

  if (loading) {
    return (
      <main
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 50,
            marginBottom: 12,
          }}
        >
          🛍️
        </div>

        <h2>
          Loading product...
        </h2>

        <p
          style={{
            color: "#6b7280",
          }}
        >
          Please wait.
        </p>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "60px 20px",
        }}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "#fef2f2",
            border:
              "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          <div
            style={{
              fontSize: 45,
              marginBottom: 10,
            }}
          >
            ❌
          </div>

          <h2>
            Unable to load product
          </h2>

          <p>
            {error}
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={loadProduct}
              style={{
                padding:
                  "11px 16px",
                border: "none",
                borderRadius: 9,
                background:
                  "#111827",
                color: "white",
                fontWeight: 700,
                cursor:
                  "pointer",
              }}
            >
              🔄 Try Again
            </button>

            <Link
              href="/paper-ink-store"
              style={{
                display:
                  "inline-block",
                padding:
                  "11px 16px",
                borderRadius: 9,
                background:
                  "#e5e7eb",
                color:
                  "#111827",
                textDecoration:
                  "none",
                fontWeight: 700,
              }}
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const outOfStock =
    product.stock <= 0;

  const unavailable =
    !product.is_active;

  const cannotBuy =
    outOfStock ||
    unavailable;

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding:
          "35px 20px 70px",
      }}
    >
      {/* TOP NAVIGATION */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <Link
          href="/paper-ink-store"
          style={{
            display:
              "inline-block",
            padding:
              "10px 15px",
            borderRadius: 9,
            background:
              "#f3f4f6",
            color:
              "#111827",
            textDecoration:
              "none",
            fontWeight: 700,
          }}
        >
          ← Back to Store
        </Link>

        <Link
          href="/paper-ink-store/cart"
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: 7,
            padding:
              "10px 15px",
            borderRadius: 9,
            background:
              "#111827",
            color: "white",
            textDecoration:
              "none",
            fontWeight: 700,
          }}
        >
          🛒 Cart
          {cartCount > 0 && (
            <span
              style={{
                minWidth: 23,
                height: 23,
                padding:
                  "0 6px",
                borderRadius:
                  999,
                background:
                  "white",
                color:
                  "#111827",
                display:
                  "inline-flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 10,
            background:
              "#fef2f2",
            border:
              "1px solid #fecaca",
            color:
              "#991b1b",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* MESSAGE */}

      {message && (
        <div
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 10,
            background:
              "#eff6ff",
            border:
              "1px solid #bfdbfe",
            color:
              "#1e40af",
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      )}

      {/* PRODUCT CARD */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(280px, 0.9fr) minmax(320px, 1.1fr)",
          gap: 35,
          background: "white",
          border:
            "1px solid #e5e7eb",
          borderRadius: 20,
          padding: 28,
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* PRODUCT IMAGE */}

        <div>
          <div
            style={{
              width: "100%",
              minHeight: 390,
              border:
                "1px solid #e5e7eb",
              borderRadius: 16,
              background:
                "#f9fafb",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              overflow:
                "hidden",
            }}
          >
            {product.image_url ? (
              <img
                src={
                  product.image_url
                }
                alt={
                  product.name
                }
                style={{
                  width: "100%",
                  height: 390,
                  objectFit:
                    "contain",
                  display:
                    "block",
                }}
                onError={(
                  event
                ) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <div
                style={{
                  textAlign:
                    "center",
                  color:
                    "#6b7280",
                }}
              >
                <div
                  style={{
                    fontSize: 80,
                  }}
                >
                  {product.category ===
                  "Printer Ink"
                    ? "🖨️"
                    : "📄"}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontWeight: 700,
                  }}
                >
                  No product image
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PRODUCT INFORMATION */}

        <div>
          {/* CATEGORY */}

          <div
            style={{
              display:
                "inline-block",
              padding:
                "6px 10px",
              borderRadius: 999,
              background:
                "#f3f4f6",
              color:
                "#374151",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {product.category}
          </div>

          {/* NAME */}

          <h1
            style={{
              margin:
                "13px 0 8px",
              fontSize: 34,
              lineHeight: 1.2,
              fontWeight: 800,
              color:
                "#111827",
            }}
          >
            {product.name}
          </h1>

          {/* BRAND */}

          {product.brand && (
            <div
              style={{
                color:
                  "#6b7280",
                fontSize: 15,
                marginBottom: 12,
              }}
            >
              Brand:{" "}
              <strong>
                {product.brand}
              </strong>
            </div>
          )}

          {/* PRICE */}

          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color:
                "#111827",
              marginTop: 15,
            }}
          >
            ₹
            {Number(
              product.price
            ).toFixed(2)}
          </div>

          {/* STOCK */}

          <div
            style={{
              marginTop: 15,
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 7,
              padding:
                "9px 13px",
              borderRadius: 9,
              background:
                getStockBackground(
                  product.stock
                ),
              color:
                getStockColor(
                  product.stock
                ),
              fontWeight: 800,
            }}
          >
            <span>
              {product.stock <= 0
                ? "❌"
                : product.stock <= 5
                ? "⚠️"
                : "✅"}
            </span>

            <span>
              {getStockText(
                product.stock
              )}
            </span>
          </div>

          {/* PRODUCT DETAILS */}

          <div
            style={{
              marginTop: 22,
              borderTop:
                "1px solid #e5e7eb",
              borderBottom:
                "1px solid #e5e7eb",
              padding:
                "16px 0",
              display: "grid",
              gap: 9,
            }}
          >
            {product.gsm !==
              null && (
              <div>
                <strong>
                  GSM:
                </strong>{" "}
                {product.gsm}
              </div>
            )}

            {product.pack_size && (
              <div>
                <strong>
                  Pack Size:
                </strong>{" "}
                {product.pack_size}
              </div>
            )}

            {product.compatibility && (
              <div>
                <strong>
                  Compatibility:
                </strong>{" "}
                {
                  product.compatibility
                }
              </div>
            )}
          </div>

          {/* DESCRIPTION */}

          {product.description && (
            <div
              style={{
                marginTop: 20,
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 8px",
                  fontSize: 20,
                }}
              >
                Product Description
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    "#4b5563",
                  lineHeight: 1.7,
                  whiteSpace:
                    "pre-wrap",
                }}
              >
                {
                  product.description
                }
              </p>
            </div>
          )}

          {/* QUANTITY */}

          {!cannotBuy && (
            <div
              style={{
                marginTop: 25,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 9,
                }}
              >
                Quantity
              </div>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  disabled={
                    quantity <= 1
                  }
                  style={{
                    width: 42,
                    height: 42,
                    border:
                      "1px solid #d1d5db",
                    borderRadius: 8,
                    background:
                      quantity <=
                      1
                        ? "#f3f4f6"
                        : "white",
                    color:
                      "#111827",
                    fontSize: 20,
                    fontWeight: 800,
                    cursor:
                      quantity <=
                      1
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  −
                </button>

                <input
                  type="number"
                  min={1}
                  max={
                    product.stock
                  }
                  value={
                    quantity
                  }
                  onChange={(event) =>
                    handleQuantityInput(
                      event
                        .target
                        .value
                    )
                  }
                  style={{
                    width: 75,
                    height: 42,
                    textAlign:
                      "center",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                />

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  disabled={
                    quantity >=
                    product.stock
                  }
                  style={{
                    width: 42,
                    height: 42,
                    border:
                      "1px solid #d1d5db",
                    borderRadius: 8,
                    background:
                      quantity >=
                      product.stock
                        ? "#f3f4f6"
                        : "white",
                    color:
                      "#111827",
                    fontSize: 20,
                    fontWeight: 800,
                    cursor:
                      quantity >=
                      product.stock
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  +
                </button>

                <span
                  style={{
                    marginLeft: 5,
                    color:
                      "#6b7280",
                    fontSize: 13,
                  }}
                >
                  Max{" "}
                  {
                    product.stock
                  }
                </span>
              </div>
            </div>
          )}

          {/* TOTAL */}

          {!cannotBuy && (
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 10,
                background:
                  "#f9fafb",
                border:
                  "1px solid #e5e7eb",
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 15,
                fontWeight: 800,
              }}
            >
              <span>
                Total
              </span>

              <span>
                ₹
                {(
                  Number(
                    product.price
                  ) *
                  quantity
                ).toFixed(2)}
              </span>
            </div>
          )}

          {/* UNAVAILABLE MESSAGE */}

          {unavailable && (
            <div
              style={{
                marginTop: 22,
                padding: 15,
                borderRadius: 10,
                background:
                  "#fef2f2",
                border:
                  "1px solid #fecaca",
                color:
                  "#991b1b",
                fontWeight: 700,
              }}
            >
              ❌ This product is
              currently unavailable.
            </div>
          )}

          {outOfStock &&
            !unavailable && (
              <div
                style={{
                  marginTop: 22,
                  padding: 15,
                  borderRadius: 10,
                  background:
                    "#fef2f2",
                  border:
                    "1px solid #fecaca",
                  color:
                    "#991b1b",
                  fontWeight: 700,
                }}
              >
                ❌ This product is
                currently out of
                stock.
              </div>
            )}

          {/* BUTTONS */}

          {!cannotBuy && (
            <div
              style={{
                display:
                  "flex",
                gap: 10,
                flexWrap:
                  "wrap",
                marginTop: 22,
              }}
            >
              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  addingToCart ||
                  buyingNow
                }
                style={{
                  flex: 1,
                  minWidth: 160,
                  padding:
                    "13px 18px",
                  border:
                    "1px solid #111827",
                  borderRadius: 10,
                  background:
                    addingToCart ||
                    buyingNow
                      ? "#9ca3af"
                      : "white",
                  color:
                    addingToCart ||
                    buyingNow
                      ? "white"
                      : "#111827",
                  fontWeight: 800,
                  cursor:
                    addingToCart ||
                    buyingNow
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {addingToCart
                  ? "Adding..."
                  : "🛒 Add to Cart"}
              </button>

              <button
                type="button"
                onClick={
                  handleBuyNow
                }
                disabled={
                  addingToCart ||
                  buyingNow
                }
                style={{
                  flex: 1,
                  minWidth: 160,
                  padding:
                    "13px 18px",
                  border: "none",
                  borderRadius: 10,
                  background:
                    addingToCart ||
                    buyingNow
                      ? "#9ca3af"
                      : "#111827",
                  color: "white",
                  fontWeight: 800,
                  cursor:
                    addingToCart ||
                    buyingNow
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {buyingNow
                  ? "Opening Cart..."
                  : "⚡ Buy Now"}
              </button>
            </div>
          )}

          {/* VIEW CART */}

          {cartCount > 0 && (
            <Link
              href="/paper-ink-store/cart"
              style={{
                display:
                  "block",
                marginTop: 12,
                textAlign:
                  "center",
                padding:
                  "11px 15px",
                borderRadius: 9,
                background:
                  "#f3f4f6",
                color:
                  "#111827",
                textDecoration:
                  "none",
                fontWeight: 700,
              }}
            >
              🛒 View Cart (
              {cartCount}{" "}
              {cartCount === 1
                ? "item"
                : "items"}
              )
            </Link>
          )}
        </div>
      </section>

      {/* STOCK INFORMATION */}

      <section
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 16,
          background:
            "#f9fafb",
          border:
            "1px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            margin:
              "0 0 10px",
            fontSize: 20,
          }}
        >
          📦 Stock Information
        </h2>

        <p
          style={{
            margin: 0,
            color:
              "#4b5563",
            lineHeight: 1.6,
          }}
        >
          {outOfStock
            ? "This product is currently out of stock. Please check again later."
            : product.stock <= 5
            ? `Only ${product.stock} unit(s) are currently available.`
            : `${product.stock} unit(s) are currently available.`}
        </p>
      </section>
    </main>
  );
}