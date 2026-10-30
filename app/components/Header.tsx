"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CartItem = {
  id: string;
  quantity: number;
};

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const updateCartCount = () => {
    try {
      const savedCart = localStorage.getItem("paperInkCart");

      if (!savedCart) {
        setCartCount(0);
        return;
      }

      const cart: CartItem[] = JSON.parse(savedCart);

      if (!Array.isArray(cart)) {
        setCartCount(0);
        return;
      }

      const totalQuantity = cart.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      );

      setCartCount(totalQuantity);
    } catch (error) {
      console.error("Cart count error:", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();

    const handleCartUpdate = () => {
      updateCartCount();
    };

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
  }, []);

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenu}
          className="site-logo"
        >
          🖼️ Image Tools
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link
            href="/"
            className="nav-link"
          >
            🏠 Home
          </Link>

          <Link
            href="/tools"
            className="nav-link"
          >
            🛠️ Tools
          </Link>

          <Link
            href="/pvc-printing"
            className="nav-link"
          >
            🖨️ PVC Printing
          </Link>

          <Link
            href="/paper-ink-store"
            className="nav-link"
          >
            🛒 Paper & Ink
          </Link>

          <Link
            href="/paper-ink-store/cart"
            className="nav-link"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span
                style={{
                  marginLeft: "5px",
                  background: "#ef4444",
                  color: "#ffffff",
                  borderRadius: "999px",
                  padding: "2px 7px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/paper-ink-store/my-orders"
            className="nav-link"
          >
            📋 My Orders
          </Link>

          <Link
            href="/track-order"
            className="nav-link"
          >
            📦 Track Order
          </Link>

          <a
            href="/#faq"
            className="nav-link"
          >
            ❓ FAQ
          </a>

          <a
            href="/#contact"
            className="nav-link"
          >
            📩 Contact
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="mobile-menu-button"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav className="mobile-nav">
          <Link
            href="/"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            🏠 Home
          </Link>

          <Link
            href="/tools"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            🛠️ Tools
          </Link>

          <Link
            href="/pvc-printing"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            🖨️ PVC Printing
          </Link>

          <Link
            href="/paper-ink-store"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            🛒 Paper & Ink
          </Link>

          <Link
            href="/paper-ink-store/cart"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span
                style={{
                  marginLeft: "6px",
                  background: "#ef4444",
                  color: "#ffffff",
                  borderRadius: "999px",
                  padding: "2px 7px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/paper-ink-store/my-orders"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            📋 My Orders
          </Link>

          <Link
            href="/track-order"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            📦 Track Order
          </Link>

          <a
            href="/#faq"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            ❓ FAQ
          </a>

          <a
            href="/#contact"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            📩 Contact
          </a>
        </nav>
      )}
    </header>
  );
}