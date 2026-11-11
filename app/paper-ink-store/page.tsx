"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

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

type StoreCoupon = {
  id: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  customer_type: "new" | "vip" | "both";
  minimum_order_amount: number;
  maximum_discount: number | null;
  expires_at: string | null;
};

type RevealedCoupon = {
  id: string;
  code: string;
};

function getCart(): CartItem[] {
  try {
    const savedCart = localStorage.getItem("paperInkCart");
    if (!savedCart) return [];

    const cart = JSON.parse(savedCart);
    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error("Cart read error:", error);
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("paperInkCart", JSON.stringify(cart));
  window.dispatchEvent(new Event("paperInkCartUpdated"));
}

function addToCart(product: StoreProduct) {
  try {
    if (product.stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    const cart = getCart();
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert(`Only ${product.stock} item(s) available in stock.`);
        return;
      }

      existingItem.quantity += 1;
      existingItem.stock = product.stock;
      existingItem.price = Number(product.price);
      existingItem.name = product.name;
      existingItem.category = product.category;
      existingItem.pack_size = product.pack_size;
      existingItem.gsm = product.gsm;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: Number(product.price),
        stock: product.stock,
        pack_size: product.pack_size,
        gsm: product.gsm,
        quantity: 1,
      });
    }

    saveCart(cart);
  } catch (error) {
    console.error("Add to cart error:", error);
    alert("Could not add product to cart.");
  }
}


function buyNow(product: StoreProduct, selectedQuantity: number) {
  try {
    if (product.stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    const quantity = Math.floor(Number(selectedQuantity));

    if (!Number.isFinite(quantity) || quantity < 1) {
      alert("Please select a valid quantity.");
      return;
    }

    if (quantity > product.stock) {
      alert(`Only ${product.stock} item(s) available in stock.`);
      return;
    }

    const cart = getCart();
    const existingItem = cart.find((item) => item.id === product.id);

    const updatedItem: CartItem = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      stock: Number(product.stock),
      pack_size: product.pack_size,
      gsm: product.gsm,
      quantity,
    };

    if (existingItem) {
      Object.assign(existingItem, updatedItem);
    } else {
      cart.push(updatedItem);
    }

    saveCart(cart);
    window.location.href = "/paper-ink-store/checkout";
  } catch (error) {
    console.error("Buy now error:", error);
    alert("Could not proceed to checkout. Please try again.");
  }
}

function decreaseQuantity(productId: string) {
  try {
    const cart = getCart();
    const item = cart.find((entry) => entry.id === productId);

    if (!item) return;

    if (item.quantity <= 1) {
      saveCart(cart.filter((entry) => entry.id !== productId));
      return;
    }

    item.quantity -= 1;
    saveCart(cart);
  } catch (error) {
    console.error("Decrease quantity error:", error);
  }
}

function increaseQuantity(product: StoreProduct) {
  try {
    if (product.stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    const cart = getCart();
    const item = cart.find((entry) => entry.id === product.id);

    if (!item) {
      addToCart(product);
      return;
    }

    if (item.quantity >= product.stock) {
      alert(`Only ${product.stock} item(s) available in stock.`);
      return;
    }

    item.quantity += 1;
    item.stock = product.stock;
    saveCart(cart);
  } catch (error) {
    console.error("Increase quantity error:", error);
  }
}

function ProductCard({
  product,
  cart,
  refreshCart,
}: {
  product: StoreProduct;
  cart: CartItem[];
  refreshCart: () => void;
}) {
  const cartItem = cart.find((item) => item.id === product.id);

  const quantity = cartItem
    ? Math.min(cartItem.quantity, product.stock)
    : 0;

  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const detailsUrl = `/paper-ink-store/product/${product.id}`;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Link href={detailsUrl} style={{ display: "block", textDecoration: "none" }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: "100%",
              height: "200px",
              objectFit: "contain",
              borderRadius: "10px",
              background: "#f8fafc",
              marginBottom: "15px",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "200px",
              borderRadius: "10px",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "55px",
              marginBottom: "15px",
            }}
          >
            {product.category === "A4 Paper" ? "📄" : "🖨️"}
          </div>
        )}
      </Link>

      <Link href={detailsUrl} style={{ textDecoration: "none", color: "#111827" }}>
        <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>
          {product.name}
        </h3>
      </Link>

      {product.description && (
        <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
          {product.description}
        </p>
      )}

      {product.brand && (
        <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
          <strong>Brand:</strong> {product.brand}
        </p>
      )}

      {product.gsm !== null && (
        <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
          <strong>GSM:</strong> {product.gsm}
        </p>
      )}

      {product.pack_size && (
        <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
          <strong>Pack:</strong> {product.pack_size}
        </p>
      )}

      {product.compatibility && (
        <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
          <strong>Compatibility:</strong> {product.compatibility}
        </p>
      )}

      <div style={{ marginTop: "auto", paddingTop: "15px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "#2563eb" }}>
            ₹{Number(product.price).toFixed(2)}
          </span>

          <span
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              textAlign: "right",
              color: outOfStock ? "#dc2626" : lowStock ? "#d97706" : "#16a34a",
            }}
          >
            {outOfStock
              ? "Out of stock"
              : lowStock
              ? `Only ${product.stock} left`
              : `${product.stock} in stock`}
          </span>
        </div>

        {quantity > 0 && !outOfStock ? (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "6px",
                borderRadius: "9px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  decreaseQuantity(product.id);
                  refreshCart();
                }}
                style={{
                  width: "42px",
                  height: "42px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#ffffff",
                  color: "#2563eb",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                −
              </button>

              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Quantity
                </div>
                <div style={{ fontSize: "19px", fontWeight: "bold" }}>
                  {quantity}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  increaseQuantity(product);
                  refreshCart();
                }}
                disabled={quantity >= product.stock}
                style={{
                  width: "42px",
                  height: "42px",
                  border: "none",
                  borderRadius: "7px",
                  background: quantity >= product.stock ? "#9ca3af" : "#2563eb",
                  color: "#ffffff",
                  fontSize: "22px",
                  cursor: quantity >= product.stock ? "not-allowed" : "pointer",
                }}
              >
                +
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: "7px",
                color: "#16a34a",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              ✓ Added to cart
            </div>

            {quantity >= product.stock && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "5px",
                  color: "#d97706",
                  fontSize: "12px",
                }}
              >
                Maximum available quantity reached
              </div>
            )}

            <button
              type="button"
              onClick={() => buyNow(product, quantity)}
              disabled={quantity < 1 || quantity > product.stock}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                background: "#16a34a",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ⚡ Buy It Now
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                addToCart(product);
                refreshCart();
              }}
              disabled={outOfStock}
              style={{
                width: "100%",
                padding: "12px 8px",
                border: "none",
                borderRadius: "8px",
                background: outOfStock ? "#9ca3af" : "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: outOfStock ? "not-allowed" : "pointer",
              }}
            >
              {outOfStock ? "Out of Stock" : "🛒 Add to Cart"}
            </button>

            <button
              type="button"
              onClick={() => buyNow(product, 1)}
              disabled={outOfStock}
              style={{
                width: "100%",
                padding: "12px 8px",
                border: "none",
                borderRadius: "8px",
                background: outOfStock ? "#9ca3af" : "#16a34a",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: outOfStock ? "not-allowed" : "pointer",
              }}
            >
              ⚡ Buy It Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCouponDiscount(coupon: StoreCoupon) {
  if (coupon.discount_type === "percentage") {
    return `${coupon.discount_value}% OFF`;
  }

  return `₹${coupon.discount_value} OFF`;
}

export default function PaperInkStorePage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCategory, setActiveCategory] =
    useState<"All" | "A4 Paper" | "Printer Ink">("All");

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponError, setCouponError] = useState("");
  const [revealedCoupon, setRevealedCoupon] =
    useState<RevealedCoupon | null>(null);
  const [revealingCouponId, setRevealingCouponId] = useState("");

  const fetchProducts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const { data, error: supabaseError } = await supabase
        .from("store_products")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("price", { ascending: true });

      if (supabaseError) {
        console.error("Store products error:", supabaseError);
        setError(supabaseError.message || "Could not load products.");
        return;
      }

      const freshProducts = (data || []) as StoreProduct[];
      setProducts(freshProducts);

      const currentCart = getCart();

      if (currentCart.length > 0) {
        const updatedCart = currentCart
          .map((cartItem) => {
            const freshProduct = freshProducts.find(
              (product) => product.id === cartItem.id
            );

            if (!freshProduct || freshProduct.stock <= 0) {
              return null;
            }

            return {
              id: freshProduct.id,
              name: freshProduct.name,
              category: freshProduct.category,
              price: Number(freshProduct.price),
              stock: Number(freshProduct.stock),
              pack_size: freshProduct.pack_size,
              gsm: freshProduct.gsm,
              quantity: Math.min(
                Math.max(1, Number(cartItem.quantity)),
                freshProduct.stock
              ),
            };
          })
          .filter((item): item is CartItem => item !== null);

        if (
          JSON.stringify(currentCart) !==
          JSON.stringify(updatedCart)
        ) {
          saveCart(updatedCart);
        }

        setCart(updatedCart);
      } else {
        setCart([]);
      }
    } catch (err) {
      console.error("Product loading error:", err);
      setError("Something went wrong while loading products.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const refreshCart = useCallback(() => {
    setCart(getCart());
  }, []);

  const loadCoupons = useCallback(async () => {
    try {
      setCouponsLoading(true);
      setCouponError("");

      const response = await fetch("/api/store-coupons/public");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load coupons.");
      }

      setCoupons(data.coupons || []);
    } catch (err) {
      setCouponError(
        err instanceof Error ? err.message : "Failed to load coupons."
      );
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  const handleRevealCoupon = useCallback(
    async (coupon: StoreCoupon) => {
      setCouponError("");
      setRevealingCouponId(coupon.id);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          const returnUrl =
            `/paper-ink-store?coupon=${encodeURIComponent(coupon.id)}#coupons`;

          window.location.href =
            `/paper-ink-store/account/login?next=${encodeURIComponent(returnUrl)}`;

          return;
        }

        const response = await fetch("/api/store-coupons/reveal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            couponId: coupon.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to reveal this coupon.");
        }

        setRevealedCoupon({
          id: coupon.id,
          code: data.code,
        });
      } catch (err) {
        setCouponError(
          err instanceof Error
            ? err.message
            : "Unable to reveal this coupon."
        );
      } finally {
        setRevealingCouponId("");
      }
    },
    []
  );

  // Initial product, cart and coupon loading.
  useEffect(() => {
    fetchProducts(true);
    refreshCart();
    loadCoupons();
  }, [fetchProducts, refreshCart, loadCoupons]);

  // Refresh stock every 30 seconds and when the tab becomes active.
  useEffect(() => {
    const stockRefresh = window.setInterval(() => {
      fetchProducts(false);
    }, 30000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchProducts(false);
      }
    }

    function handleWindowFocus() {
      fetchProducts(false);
    }

    const handleCartUpdate = () => refreshCart();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("paperInkCartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.clearInterval(stockRefresh);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener(
        "paperInkCartUpdated",
        handleCartUpdate
      );
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, [fetchProducts, refreshCart]);

  // Automatically reveal a selected coupon after successful login.
  useEffect(() => {
    let cancelled = false;

    async function revealCouponAfterLogin() {
      const params = new URLSearchParams(window.location.search);
      const couponId = params.get("coupon");

      if (!couponId) return;

      const coupon = coupons.find((item) => item.id === couponId);
      if (!coupon) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled || !session) return;

      await handleRevealCoupon(coupon);

      if (!cancelled) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("coupon");
        window.history.replaceState({}, "", cleanUrl.toString());
      }
    }

    if (coupons.length > 0) {
      revealCouponAfterLogin();
    }

    return () => {
      cancelled = true;
    };
  }, [coupons, handleRevealCoupon]);

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    if (!matchesCategory) return false;
    if (!normalizedSearch) return true;

    const searchableText = [
      product.name,
      product.category,
      product.description,
      product.brand,
      product.gsm !== null ? String(product.gsm) : "",
      product.pack_size,
      product.compatibility,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const paperProducts = filteredProducts.filter(
    (product) => product.category === "A4 Paper"
  );

  const inkProducts = filteredProducts.filter(
    (product) => product.category === "Printer Ink"
  );

  const showPaper =
    activeCategory === "All" || activeCategory === "A4 Paper";

  const showInk =
    activeCategory === "All" || activeCategory === "Printer Ink";

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef4ff, #f8fbff)",
        paddingBottom: cartCount > 0 ? "110px" : "60px",
      }}
    >
      {/* HERO */}
      <section
        style={{
          padding: "45px 20px 25px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "38px",
            fontWeight: "800",
            color: "#111827",
            marginBottom: "12px",
          }}
        >
          📄 Paper & Ink Store
        </h1>

        <p
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            fontSize: "17px",
            lineHeight: "1.6",
            color: "#4b5563",
          }}
        >
          Choose your A4 paper and printer ink, add everything you need
          to your cart, and checkout when you are ready.
        </p>

        <div
          style={{
            marginTop: "25px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Link
            href="/paper-ink-store/cart"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px 24px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: "9px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "16px",
              boxShadow: "0 4px 10px rgba(37,99,235,0.25)",
            }}
          >
            🛒 View Cart
            {cartCount > 0 && (
              <span
                style={{
                  background: "#ffffff",
                  color: "#2563eb",
                  borderRadius: "50%",
                  minWidth: "24px",
                  height: "24px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </section>

      {/* COUPONS */}
      <section
        id="coupons"
        style={{
          maxWidth: "1100px",
          margin: "10px auto 35px",
          padding: "0 20px",
          scrollMarginTop: "25px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #bfdbfe",
            borderRadius: "16px",
            padding: "25px",
            boxShadow: "0 5px 18px rgba(37,99,235,0.08)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <div style={{ fontSize: "35px" }}>🎁</div>
            <h2
              style={{
                fontSize: "27px",
                color: "#111827",
                margin: "8px 0",
              }}
            >
              Special Offers & Coupons
            </h2>
            <p style={{ color: "#64748b", margin: 0 }}>
              Discover available discounts for your A4 Paper and Printer Ink orders.
            </p>
          </div>

          {couponsLoading && (
            <p style={{ textAlign: "center", color: "#64748b" }}>
              Loading available offers...
            </p>
          )}

          {couponError && (
            <p
              style={{
                textAlign: "center",
                color: "#b91c1c",
                background: "#fef2f2",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              {couponError}
            </p>
          )}

          {!couponsLoading && coupons.length === 0 && !couponError && (
            <p style={{ textAlign: "center", color: "#64748b" }}>
              No active coupons available right now. Please check again later.
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {coupons.map((coupon) => {
              const revealed = revealedCoupon?.id === coupon.id;

              return (
                <div
                  key={coupon.id}
                  style={{
                    border: "1px dashed #93c5fd",
                    borderRadius: "12px",
                    padding: "18px",
                    background: "#f8fbff",
                  }}
                >
                  <div
                    style={{
                      color: "#1d4ed8",
                      fontSize: "24px",
                      fontWeight: "800",
                    }}
                  >
                    {formatCouponDiscount(coupon)}
                  </div>

                  <p
                    style={{
                      color: "#374151",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      minHeight: "42px",
                    }}
                  >
                    {coupon.description || "Special discount on your order."}
                  </p>

                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    Minimum order: ₹
                    {Number(coupon.minimum_order_amount || 0).toFixed(2)}
                  </p>

                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    {coupon.customer_type === "new"
                      ? "For new customers"
                      : coupon.customer_type === "vip"
                      ? "For eligible VIP customers"
                      : "For eligible new or VIP customers"}
                  </p>

                  {coupon.expires_at && (
                    <p style={{ fontSize: "12px", color: "#64748b" }}>
                      Valid until:{" "}
                      {new Date(coupon.expires_at).toLocaleDateString("en-IN")}
                    </p>
                  )}

                  {revealed ? (
                    <div
                      style={{
                        background: "#dcfce7",
                        border: "1px solid #86efac",
                        color: "#166534",
                        borderRadius: "8px",
                        padding: "11px",
                        textAlign: "center",
                        fontWeight: "bold",
                        overflowWrap: "anywhere",
                      }}
                    >
                      Coupon code: {revealedCoupon.code}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRevealCoupon(coupon)}
                      disabled={revealingCouponId === coupon.id}
                      style={{
                        width: "100%",
                        padding: "11px",
                        border: "none",
                        borderRadius: "8px",
                        background:
                          revealingCouponId === coupon.id
                            ? "#9ca3af"
                            : "#2563eb",
                        color: "#ffffff",
                        fontWeight: "bold",
                        cursor:
                          revealingCouponId === coupon.id
                            ? "wait"
                            : "pointer",
                      }}
                    >
                      {revealingCouponId === coupon.id
                        ? "Please wait..."
                        : "🎟️ Get Coupon"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CATEGORY BUTTONS */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 20px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {(["All", "A4 Paper", "Printer Ink"] as const).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #2563eb",
                background:
                  activeCategory === category ? "#2563eb" : "#ffffff",
                color: activeCategory === category ? "#ffffff" : "#2563eb",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {category === "All"
                ? "🛍️ All Products"
                : category === "A4 Paper"
                ? "📄 A4 Paper"
                : "🖨️ Printer Ink"}
            </button>
          ))}
        </div>
      </section>

      {/* SEARCH */}
      <section
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 20px 30px",
        }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="🔎 Search paper, ink, brand, GSM, pack size..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "15px",
            border: "1px solid #cbd5e1",
            borderRadius: "12px",
            background: "#ffffff",
            fontSize: "16px",
            outline: "none",
          }}
        />

        {hasSearch && (
          <div
            style={{
              textAlign: "center",
              marginTop: "10px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {filteredProducts.length === 0
              ? "No matching products found."
              : `${filteredProducts.length} product(s) found`}
          </div>
        )}
      </section>

      {/* PRODUCTS */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              fontSize: "18px",
              color: "#4b5563",
            }}
          >
            Loading products...
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              maxWidth: "700px",
              margin: "30px auto",
              padding: "18px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            {error}
            <div style={{ marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => fetchProducts(true)}
                style={{
                  padding: "9px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#991b1b",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: "#6b7280",
            }}
          >
            No products available.
          </div>
        )}

        {!loading &&
          !error &&
          products.length > 0 &&
          filteredProducts.length === 0 && (
            <div
              style={{
                maxWidth: "650px",
                margin: "20px auto 50px",
                padding: "30px 20px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "45px" }}>🔎</div>
              <h2 style={{ color: "#111827" }}>No products found</h2>
              <p style={{ color: "#6b7280" }}>
                Try another search term or choose a different category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory("All");
                }}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 20px",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Show All Products
              </button>
            </div>
          )}

        {!loading && !error && showPaper && paperProducts.length > 0 && (
          <section style={{ marginBottom: "45px" }}>
            <h2
              style={{
                fontSize: "28px",
                color: "#111827",
                marginBottom: "20px",
              }}
            >
              📄 A4 Paper
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "20px",
              }}
            >
              {paperProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cart={cart}
                  refreshCart={refreshCart}
                />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && showInk && inkProducts.length > 0 && (
          <section style={{ marginBottom: "45px" }}>
            <h2
              style={{
                fontSize: "28px",
                color: "#111827",
                marginBottom: "20px",
              }}
            >
              🖨️ Printer Ink
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "20px",
              }}
            >
              {inkProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cart={cart}
                  refreshCart={refreshCart}
                />
              ))}
            </div>
          </section>
        )}
      </section>

      {/* PVC SECTION */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "30px auto 0",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "25px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "25px",
              marginBottom: "10px",
              color: "#111827",
            }}
          >
            🪪 Need PVC Cards?
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "18px" }}>
            Order your PVC cards from our West Bengal PVC printing service.
          </p>
          <Link
            href="/pvc-printing"
            style={{
              display: "inline-block",
              padding: "12px 22px",
              background: "#111827",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            🖨️ PVC Printing
          </Link>
        </div>
      </section>

      {/* FIXED CART BAR */}
      {cartCount > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            boxShadow: "0 -4px 15px rgba(0,0,0,0.12)",
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "15px",
            }}
          >
            <div>
              <strong style={{ fontSize: "17px", color: "#111827" }}>
                🛒 {cartCount} {cartCount === 1 ? "item" : "items"}
              </strong>
              <div
                style={{
                  fontSize: "14px",
                  color: "#2563eb",
                  fontWeight: "bold",
                  marginTop: "3px",
                }}
              >
                ₹{cartTotal.toFixed(2)}
              </div>
            </div>

            <Link
              href="/paper-ink-store/cart"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "12px 22px",
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: "9px",
                textDecoration: "none",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              View Cart →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}