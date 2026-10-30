"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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

type StoreProduct = {
  id: string;
  name: string;
  category: "A4 Paper" | "Printer Ink";
  price: number;
  stock: number;
  pack_size: string | null;
  gsm: number | null;
  is_active: boolean;
};

export default function PaperInkCartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const saved =
        localStorage.getItem("paperInkCart");

      if (!saved) {
        setCart([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (
        !Array.isArray(parsed) ||
        parsed.length === 0
      ) {
        setCart([]);
        return;
      }

      const productIds = parsed
        .map((item: any) => item?.id)
        .filter(Boolean);

      if (productIds.length === 0) {
        setCart([]);
        localStorage.removeItem(
          "paperInkCart"
        );
        return;
      }

      setRefreshing(true);

      const {
        data: products,
        error,
      } = await supabase
        .from("store_products")
        .select(
          `
          id,
          name,
          category,
          price,
          stock,
          pack_size,
          gsm,
          is_active
          `
        )
        .in("id", productIds);

      if (error) {
        console.error(
          "Product refresh error:",
          error
        );

        /*
         * If Supabase cannot be reached,
         * do NOT use possibly broken old prices.
         */
        alert(
          "Unable to refresh product prices. Please try again."
        );

        setCart([]);
        localStorage.removeItem(
          "paperInkCart"
        );

        return;
      }

      const refreshedCart: CartItem[] = [];

      for (const oldItem of parsed) {
        const product = (
          products || []
        ).find(
          (p: StoreProduct) =>
            p.id === String(oldItem.id)
        );

        if (!product) {
          continue;
        }

        if (!product.is_active) {
          continue;
        }

        const quantity = Number(
          oldItem.quantity
        );

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          continue;
        }

        const currentStock = Number(
          product.stock
        );

        if (
          !Number.isFinite(currentStock) ||
          currentStock <= 0
        ) {
          continue;
        }

        const currentPrice = Number(
          product.price
        );

        if (
          !Number.isFinite(currentPrice) ||
          currentPrice < 0
        ) {
          continue;
        }

        const safeQuantity = Math.min(
          quantity,
          currentStock
        );

        if (safeQuantity <= 0) {
          continue;
        }

        refreshedCart.push({
          id: product.id,

          name: product.name,

          category:
            product.category ===
            "Printer Ink"
              ? "Printer Ink"
              : "A4 Paper",

          price: currentPrice,

          stock: currentStock,

          pack_size:
            product.pack_size ?? null,

          gsm:
            product.gsm !== null &&
            product.gsm !== undefined
              ? Number(product.gsm)
              : null,

          quantity: safeQuantity,
        });
      }

      setCart(refreshedCart);

      localStorage.setItem(
        "paperInkCart",
        JSON.stringify(refreshedCart)
      );

      window.dispatchEvent(
        new Event("paperInkCartUpdated")
      );
    } catch (error) {
      console.error(
        "Cart loading error:",
        error
      );

      setCart([]);
      localStorage.removeItem(
        "paperInkCart"
      );
    } finally {
      setLoaded(true);
      setRefreshing(false);
    }
  }

  function saveCart(
    updatedCart: CartItem[]
  ) {
    setCart(updatedCart);

    localStorage.setItem(
      "paperInkCart",
      JSON.stringify(updatedCart)
    );

    window.dispatchEvent(
      new Event("paperInkCartUpdated")
    );
  }

  function increaseQuantity(
    id: string
  ) {
    const updatedCart = cart.map(
      (item) => {
        if (item.id !== id) {
          return item;
        }

        if (
          item.quantity >=
          item.stock
        ) {
          alert(
            `Only ${item.stock} item(s) available in stock.`
          );

          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity + 1,
        };
      }
    );

    saveCart(updatedCart);
  }

  function decreaseQuantity(
    id: string
  ) {
    const updatedCart = cart
      .map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity - 1,
        };
      })
      .filter(
        (item) =>
          item.quantity > 0
      );

    saveCart(updatedCart);
  }

  function removeItem(
    id: string
  ) {
    const updatedCart =
      cart.filter(
        (item) =>
          item.id !== id
      );

    saveCart(updatedCart);
  }

  function clearCart() {
    const confirmed =
      window.confirm(
        "Are you sure you want to clear your entire cart?"
      );

    if (!confirmed) {
      return;
    }

    setCart([]);

    localStorage.removeItem(
      "paperInkCart"
    );

    window.dispatchEvent(
      new Event("paperInkCartUpdated")
    );
  }

  const totalItems =
    cart.reduce(
      (total, item) =>
        total +
        item.quantity,
      0
    );

  const totalPrice =
    cart.reduce(
      (total, item) =>
        total +
        item.price *
          item.quantity,
      0
    );

  if (!loaded) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontSize: "18px",
          color: "#555",
        }}
      >
        Loading cart...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eef4ff, #f8fbff)",
        padding:
          "40px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1
              style={{
                color: "#1e3a8a",
                margin:
                  "0 0 8px",
              }}
            >
              🛒 Shopping Cart
            </h1>

            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              {totalItems}{" "}
              item
              {totalItems !== 1
                ? "s"
                : ""}{" "}
              in your cart
            </p>
          </div>

          <Link
            href="/paper-ink-store"
            style={{
              padding:
                "11px 18px",
              background:
                "#2563eb",
              color: "white",
              textDecoration:
                "none",
              borderRadius:
                "8px",
              fontWeight:
                "bold",
            }}
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* REFRESHING */}

        {refreshing && (
          <div
            style={{
              background:
                "#eff6ff",
              border:
                "1px solid #bfdbfe",
              color:
                "#1d4ed8",
              borderRadius:
                "10px",
              padding:
                "12px 15px",
              marginBottom:
                "20px",
              textAlign:
                "center",
            }}
          >
            🔄 Updating current prices and stock...
          </div>
        )}

        {/* EMPTY CART */}

        {cart.length === 0 ? (
          <div
            style={{
              background:
                "white",
              borderRadius:
                "16px",
              padding:
                "50px 25px",
              textAlign:
                "center",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize:
                  "60px",
                marginBottom:
                  "15px",
              }}
            >
              🛒
            </div>

            <h2
              style={{
                color:
                  "#1e3a8a",
              }}
            >
              Your cart is empty
            </h2>

            <p
              style={{
                color: "#666",
                marginBottom:
                  "25px",
              }}
            >
              Add some paper or printer ink
              to your cart.
            </p>

            <Link
              href="/paper-ink-store"
              style={{
                display:
                  "inline-block",
                padding:
                  "13px 25px",
                background:
                  "#16a34a",
                color: "white",
                textDecoration:
                  "none",
                borderRadius:
                  "8px",
                fontWeight:
                  "bold",
              }}
            >
              🛒 Shop Now
            </Link>
          </div>
        ) : (
          <>
            {/* CART ITEMS */}

            <div
              style={{
                display:
                  "grid",
                gap: "15px",
              }}
            >
              {cart.map(
                (item) => (
                  <div
                    key={item.id}
                    className="paper-ink-cart-item"
                    style={{
                      background:
                        "white",
                      borderRadius:
                        "14px",
                      padding:
                        "20px",
                      boxShadow:
                        "0 6px 18px rgba(0,0,0,0.07)",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "18px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    {/* ICON */}

                    <div
                      className="paper-ink-cart-icon"
                      style={{
                        width:
                          "70px",
                        height:
                          "70px",
                        background:
                          "#f1f5f9",
                        borderRadius:
                          "10px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontSize:
                          "38px",
                        flexShrink:
                          0,
                      }}
                    >
                      {item.category ===
                      "A4 Paper"
                        ? "📄"
                        : "🖨️"}
                    </div>

                    {/* DETAILS */}

                    <div
                      className="paper-ink-cart-item-details"
                      style={{
                        flex: 1,
                        minWidth:
                          "200px",
                      }}
                    >
                      <h3
                        style={{
                          margin:
                            "0 0 7px",
                          color:
                            "#222",
                        }}
                      >
                        {item.name}
                      </h3>

                      <div
                        style={{
                          fontSize:
                            "13px",
                          color:
                            "#666",
                          marginBottom:
                            "4px",
                        }}
                      >
                        Category:{" "}
                        {
                          item.category
                        }
                      </div>

                      {item.gsm !==
                        null && (
                        <div
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "#666",
                          }}
                        >
                          GSM:{" "}
                          {
                            item.gsm
                          }
                        </div>
                      )}

                      {item.pack_size && (
                        <div
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "#666",
                          }}
                        >
                          Pack:{" "}
                          {
                            item.pack_size
                          }
                        </div>
                      )}

                      <strong
                        style={{
                          display:
                            "block",
                          marginTop:
                            "8px",
                          color:
                            "#16a34a",
                        }}
                      >
                        ₹
                        {item.price.toFixed(
                          2
                        )}{" "}
                        per item
                      </strong>
                    </div>

                    {/* QUANTITY */}

                    <div
                      className="paper-ink-cart-quantity"
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "8px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(
                            item.id
                          )
                        }
                        style={{
                          width:
                            "38px",
                          height:
                            "38px",
                          padding: 0,
                          margin: 0,
                          border:
                            "1px solid #cbd5e1",
                          background:
                            "white",
                          color:
                            "#2563eb",
                          borderRadius:
                            "7px",
                          cursor:
                            "pointer",
                          fontSize:
                            "20px",
                          fontWeight:
                            "bold",
                        }}
                      >
                        −
                      </button>

                      <strong
                        style={{
                          minWidth:
                            "35px",
                          textAlign:
                            "center",
                          fontSize:
                            "17px",
                        }}
                      >
                        {
                          item.quantity
                        }
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(
                            item.id
                          )
                        }
                        disabled={
                          item.quantity >=
                          item.stock
                        }
                        style={{
                          width:
                            "38px",
                          height:
                            "38px",
                          padding: 0,
                          margin: 0,
                          border:
                            "1px solid #2563eb",
                          background:
                            item.quantity >=
                            item.stock
                              ? "#e5e7eb"
                              : "#2563eb",
                          color:
                            item.quantity >=
                            item.stock
                              ? "#9ca3af"
                              : "white",
                          borderRadius:
                            "7px",
                          cursor:
                            item.quantity >=
                            item.stock
                              ? "not-allowed"
                              : "pointer",
                          fontSize:
                            "20px",
                          fontWeight:
                            "bold",
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* ITEM TOTAL */}

                    <strong
                      className="paper-ink-cart-total"
                      style={{
                        minWidth:
                          "100px",
                        textAlign:
                          "right",
                        color:
                          "#1e3a8a",
                        fontSize:
                          "18px",
                      }}
                    >
                      ₹
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(
                        2
                      )}
                    </strong>

                    {/* REMOVE */}

                    <div className="paper-ink-cart-remove">
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(
                            item.id
                          )
                        }
                        style={{
                          width:
                            "auto",
                          border:
                            "none",
                          background:
                            "#fee2e2",
                          color:
                            "#b91c1c",
                          padding:
                            "9px 12px",
                          margin: 0,
                          borderRadius:
                            "7px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* SUMMARY */}

            <div
              style={{
                background:
                  "white",
                borderRadius:
                  "16px",
                padding:
                  "25px",
                marginTop:
                  "25px",
                boxShadow:
                  "0 8px 25px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  marginBottom:
                    "12px",
                  color:
                    "#555",
                }}
              >
                <span>
                  Total Items
                </span>

                <strong>
                  {totalItems}
                </strong>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  marginBottom:
                    "12px",
                  color:
                    "#555",
                }}
              >
                <span>
                  Number of Products
                </span>

                <strong>
                  {cart.length}
                </strong>
              </div>

              <div
                style={{
                  borderTop:
                    "1px solid #ddd",
                  paddingTop:
                    "15px",
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap:
                    "15px",
                }}
              >
                <strong
                  style={{
                    fontSize:
                      "22px",
                    color:
                      "#1e3a8a",
                  }}
                >
                  Total
                </strong>

                <strong
                  style={{
                    fontSize:
                      "26px",
                    color:
                      "#16a34a",
                  }}
                >
                  ₹
                  {totalPrice.toFixed(
                    2
                  )}
                </strong>
              </div>

              {/* CHECKOUT */}

              <Link
                href="/paper-ink-store/checkout"
                style={{
                  display:
                    "block",
                  width:
                    "100%",
                  padding:
                    "14px",
                  marginTop:
                    "15px",
                  background:
                    "#2563eb",
                  color:
                    "#fff",
                  textAlign:
                    "center",
                  textDecoration:
                    "none",
                  borderRadius:
                    "10px",
                  fontWeight:
                    "bold",
                  boxSizing:
                    "border-box",
                }}
              >
                💳 Proceed to Checkout
              </Link>

              {/* CLEAR CART */}

              <button
                type="button"
                onClick={
                  clearCart
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    "10px",
                  padding:
                    "11px",
                  border:
                    "1px solid #dc2626",
                  background:
                    "white",
                  color:
                    "#dc2626",
                  borderRadius:
                    "8px",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                🗑️ Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}