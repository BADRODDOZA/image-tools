"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
    }
  }, []);

  function updateCart(updatedCart: CartItem[]) {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  }

  function increaseQuantity(id: string) {
    const updated = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );

    updateCart(updated);
  }

  function decreaseQuantity(id: string) {
    const updated = cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0);

    updateCart(updated);
  }

  function removeItem(id: string) {
    const updated = cart.filter((item) => item.id !== id);
    updateCart(updated);
  }

  function clearCart() {
    localStorage.removeItem("cart");
    setCart([]);
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "10px",
          }}
        >
          🛒 Shopping Cart
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "30px",
          }}
        >
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </p>

        {cart.length === 0 ? (
          <div
            style={{
              background: "white",
              padding: "50px 20px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "50px" }}>🛒</div>

            <h2>Your cart is empty</h2>

            <p style={{ color: "#666" }}>
              Add A4 paper or printer ink to your cart.
            </p>

            <Link
              href="/"
              style={{
                display: "inline-block",
                marginTop: "20px",
                padding: "12px 22px",
                background: "#2563eb",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "white",
                  padding: "20px",
                  marginBottom: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontSize: "45px",
                    width: "70px",
                    textAlign: "center",
                  }}
                >
                  {item.category?.toLowerCase().includes("ink")
                    ? "🖨️"
                    : "📄"}
                </div>

                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      margin: "0 0 5px",
                      fontSize: "20px",
                    }}
                  >
                    {item.name}
                  </h2>

                  <p
                    style={{
                      margin: "0 0 5px",
                      color: "#666",
                    }}
                  >
                    {item.category}
                  </p>

                  <strong>₹{item.price}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    style={{
                      width: "35px",
                      height: "35px",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    −
                  </button>

                  <strong>{item.quantity}</strong>

                  <button
                    onClick={() => increaseQuantity(item.id)}
                    style={{
                      width: "35px",
                      height: "35px",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    +
                  </button>
                </div>

                <strong
                  style={{
                    minWidth: "80px",
                    textAlign: "right",
                  }}
                >
                  ₹{item.price * item.quantity}
                </strong>

                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    border: "none",
                    background: "#fee2e2",
                    color: "#dc2626",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <div
              style={{
                background: "white",
                padding: "25px",
                borderRadius: "12px",
                marginTop: "25px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "22px",
                  fontWeight: "700",
                  marginBottom: "20px",
                }}
              >
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={clearCart}
                  style={{
                    padding: "13px 20px",
                    border: "1px solid #dc2626",
                    background: "white",
                    color: "#dc2626",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Clear Cart
                </button>

                <Link
                  href="/checkout"
                  style={{
                    flex: 1,
                    padding: "13px 20px",
                    background: "#16a34a",
                    color: "white",
                    borderRadius: "8px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: "700",
                  }}
                >
                  Proceed to Checkout →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}