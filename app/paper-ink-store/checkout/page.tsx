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

export default function PaperInkCheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    loadCart();

    function handleCartUpdate() {
      loadCart();
    }

    window.addEventListener(
      "paperInkCartUpdated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "paperInkCartUpdated",
        handleCartUpdate
      );
    };
  }, []);

  async function loadCart() {
    try {
      setMessage("");

      const saved =
        localStorage.getItem("paperInkCart");

      if (!saved) {
        setCart([]);
        return;
      }

      let parsed: any;

      try {
        parsed = JSON.parse(saved);
      } catch (error) {
        console.error(
          "Invalid paperInkCart JSON:",
          error
        );

        localStorage.removeItem(
          "paperInkCart"
        );

        setCart([]);

        setMessage(
          "Your saved cart could not be read. Please add the products again."
        );

        return;
      }

      if (
        !Array.isArray(parsed) ||
        parsed.length === 0
      ) {
        setCart([]);
        return;
      }

      /*
       * Get valid product IDs from localStorage.
       */
      const productIds = parsed
        .map((item: any) =>
          String(item?.id || "").trim()
        )
        .filter(Boolean);

      if (productIds.length === 0) {
        setCart([]);

        localStorage.removeItem(
          "paperInkCart"
        );

        setMessage(
          "No valid products were found in your cart."
        );

        return;
      }

      /*
       * Remove duplicate product IDs.
       */
      const uniqueProductIds =
        Array.from(
          new Set(productIds)
        );

      /*
       * Always get the latest product
       * information from Supabase.
       *
       * Price and stock are NOT trusted
       * from localStorage.
       */
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
        .in(
          "id",
          uniqueProductIds
        );

      if (error) {
        /*
         * IMPORTANT:
         * Show the complete Supabase error
         * in the browser console.
         */
        console.error(
          "Checkout product loading error:",
          JSON.stringify(
            {
              message:
                error.message,
              details:
                error.details,
              hint:
                error.hint,
              code:
                error.code,
            },
            null,
            2
          )
        );

        console.error(
          "Checkout product IDs:",
          uniqueProductIds
        );

        console.error(
          "Checkout Supabase error object:",
          error
        );

        setCart([]);

        setMessage(
          `Unable to load the latest product information. ${
            error.message ||
            "Please return to the cart and try again."
          }`
        );

        return;
      }

      /*
       * Make sure Supabase actually returned
       * products.
       */
      if (
        !products ||
        products.length === 0
      ) {
        console.error(
          "Checkout: no products returned from Supabase."
        );

        console.error(
          "Requested product IDs:",
          uniqueProductIds
        );

        setCart([]);

        setMessage(
          "The products in your cart could not be found. Please return to the store and add them again."
        );

        return;
      }

      const refreshedCart: CartItem[] = [];

      for (const oldItem of parsed) {
        const oldId =
          String(
            oldItem?.id || ""
          ).trim();

        if (!oldId) {
          continue;
        }

        const product =
          products.find(
            (p: any) =>
              String(p.id) === oldId
          );

        if (!product) {
          console.warn(
            "Checkout product not found:",
            oldId
          );

          continue;
        }

        /*
         * Do not allow inactive products
         * to proceed to checkout.
         */
        if (
          product.is_active === false
        ) {
          console.warn(
            "Checkout product is inactive:",
            product.name
          );

          continue;
        }

        const quantity =
          Number(
            oldItem?.quantity
          );

        const price =
          Number(
            product.price
          );

        const stock =
          Number(
            product.stock
          );

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          console.warn(
            "Invalid checkout quantity:",
            oldItem
          );

          continue;
        }

        if (
          !Number.isFinite(
            price
          ) ||
          price < 0
        ) {
          console.warn(
            "Invalid product price:",
            product
          );

          continue;
        }

        if (
          !Number.isFinite(
            stock
          ) ||
          stock <= 0
        ) {
          console.warn(
            "Product is out of stock:",
            product.name
          );

          continue;
        }

        /*
         * Never allow the checkout quantity
         * to exceed the current stock.
         */
        const safeQuantity =
          Math.min(
            quantity,
            stock
          );

        if (
          safeQuantity <= 0
        ) {
          continue;
        }

        refreshedCart.push({
          id:
            product.id,

          name:
            product.name,

          category:
            product.category ===
            "Printer Ink"
              ? "Printer Ink"
              : "A4 Paper",

          price,

          stock,

          pack_size:
            product.pack_size ??
            null,

          gsm:
            product.gsm !==
              null &&
            product.gsm !==
              undefined
              ? Number(
                  product.gsm
                )
              : null,

          quantity:
            safeQuantity,
        });
      }

      /*
       * If every item disappeared because
       * it is inactive, missing or out of stock.
       */
      if (
        refreshedCart.length === 0
      ) {
        setCart([]);

        localStorage.removeItem(
          "paperInkCart"
        );

        setMessage(
          "The products in your cart are no longer available. Please return to the store."
        );

        return;
      }

      setCart(
        refreshedCart
      );

      /*
       * Save the refreshed product information.
       */
      localStorage.setItem(
        "paperInkCart",
        JSON.stringify(
          refreshedCart
        )
      );

      window.dispatchEvent(
        new Event(
          "paperInkCartUpdated"
        )
      );
    } catch (error) {
      console.error(
        "Checkout cart error:",
        error
      );

      console.error(
        "Checkout cart error JSON:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      setCart([]);

      setMessage(
        "Unable to load your cart. Please return to the cart and try again."
      );
    } finally {
      setLoaded(true);
    }
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

    async function handleApplyCoupon() {
  if (couponLoading || !couponCode.trim()) {
    setCouponMessage("Please enter a coupon code.");
    return;
  }

  const cleanMobile = mobile.replace(/\D/g, "");

  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    setCouponMessage("Please enter your valid 10-digit mobile number first.");
    return;
  }

  if (cart.length === 0 || totalPrice <= 0) {
    setCouponMessage("Your cart is empty.");
    return;
  }

  setCouponLoading(true);
  setAppliedCoupon(null);
  setCouponMessage("Checking coupon...");

  try {
    const response = await fetch("/api/store-coupons/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: couponCode.trim().toUpperCase(),
        mobile: cleanMobile,
        subtotal: totalPrice,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setAppliedCoupon(null);
      setCouponMessage(result.error || "This coupon cannot be applied.");
      return;
    }

    setAppliedCoupon(result);
    setCouponCode(result.couponCode);
    setCouponMessage(result.message || "Coupon applied successfully!");
  } catch (error) {
    console.error("Coupon validation error:", error);
    setAppliedCoupon(null);
    setCouponMessage("Unable to validate coupon. Please try again.");
  } finally {
    setCouponLoading(false);
  }
}
  function validateForm() {
    const cleanMobile =
      mobile.replace(
        /\D/g,
        ""
      );

    const cleanPin =
      pinCode.replace(
        /\D/g,
        ""
      );

    if (!name.trim()) {
      setMessage(
        "Please enter your full name."
      );

      return false;
    }

    if (
      !/^[6-9]\d{9}$/.test(
        cleanMobile
      )
    ) {
      setMessage(
        "Please enter a valid 10-digit Indian mobile number."
      );

      return false;
    }

    if (!address.trim()) {
      setMessage(
        "Please enter your complete delivery address."
      );

      return false;
    }

    if (!city.trim()) {
      setMessage(
        "Please enter your city."
      );

      return false;
    }

    if (!state.trim()) {
      setMessage(
        "Please enter your state."
      );

      return false;
    }

    if (
      !/^\d{6}$/.test(
        cleanPin
      )
    ) {
      setMessage(
        "Please enter a valid 6-digit PIN code."
      );

      return false;
    }

    if (
      cart.length === 0
    ) {
      setMessage(
        "Your cart is empty."
      );

      return false;
    }

    if (
      !Number.isFinite(
        totalPrice
      ) ||
      totalPrice <= 0
    ) {
      setMessage(
        "Your order total must be greater than ₹0."
      );

      return false;
    }

    for (const item of cart) {
      if (
        !Number.isFinite(
          item.price
        ) ||
        item.price < 0
      ) {
        setMessage(
          `Invalid price for ${item.name}. Please return to the cart and try again.`
        );

        return false;
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <= 0
      ) {
        setMessage(
          `Invalid quantity for ${item.name}.`
        );

        return false;
      }

      if (
        item.quantity >
        item.stock
      ) {
        setMessage(
          `Only ${item.stock} item(s) of ${item.name} are currently available.`
        );

        return false;
      }
    }

    setMessage("");

    return true;
  }

  async function verifyStorePayment(
    storeOrderId: string,
    response: any
  ) {
    try {
      const verifyResponse =
        await fetch(
          "/api/razorpay/verify-payment",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              storeOrderId,

              razorpay_order_id:
                response.razorpay_order_id,

              razorpay_payment_id:
                response.razorpay_payment_id,

              razorpay_signature:
                response.razorpay_signature,
            }),
          }
        );

      let verifyResult: any;

      try {
        verifyResult =
          await verifyResponse.json();
      } catch {
        return {
          success: false,
          error:
            "Payment verification server returned an invalid response.",
        };
      }

      if (
        !verifyResponse.ok ||
        !verifyResult.success
      ) {
        return {
          success: false,
          error:
            verifyResult.error ||
            "Payment verification failed.",
        };
      }

      return {
        success: true,
        result:
          verifyResult,
      };
    } catch (error) {
      console.error(
        "Store payment verification error:",
        error
      );

      return {
        success: false,
        error:
          "Unable to verify your payment.",
      };
    }
  }

  async function handleSuccessfulPayment(
    storeOrderId: string,
    response: any
  ) {
    setMessage(
      "Payment successful. Verifying payment and updating stock..."
    );

    const verification =
      await verifyStorePayment(
        storeOrderId,
        response
      );

    if (
      !verification.success
    ) {
      console.error(
        "Payment verification failed:",
        verification.error
      );

      setMessage(
        verification.error ||
          "Payment verification failed. Please contact support."
      );

      setProcessing(
        false
      );

      return;
    }

    /*
     * Payment has been verified by the server.
     */
    sessionStorage.setItem(
      "paperInkPayment",
      JSON.stringify({
        storeOrderId,

        razorpayOrderId:
          response.razorpay_order_id,

        razorpayPaymentId:
          response.razorpay_payment_id,

        razorpaySignature:
          response.razorpay_signature,

        verified:
          true,
      })
    );

    /*
     * Clear cart only after
     * successful verification.
     */
    localStorage.removeItem(
      "paperInkCart"
    );

    window.dispatchEvent(
      new Event(
        "paperInkCartUpdated"
      )
    );

    /*
     * Working confirmation route.
     */
    window.location.href =
      `/paper-ink-store/order/confirmation?orderId=${encodeURIComponent(
        storeOrderId
      )}`;
  }

  async function handleContinue() {
    if (processing) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setProcessing(
      true
    );

    setMessage(
      "Creating your order..."
    );

    try {
      /*
       * ==========================================
       * STEP 1
       * CREATE STORE ORDER
       * ==========================================
       */

      const orderResponse =
        await fetch(
          "/api/store-orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              customer: {
                name:
                  name.trim(),

                mobile:
                  mobile.replace(
                    /\D/g,
                    ""
                  ),

                address:
                  address.trim(),

                landmark:
                  landmark.trim(),

                city:
                  city.trim(),

                state:
                  state.trim(),

                pinCode:
                  pinCode.replace(
                    /\D/g,
                    ""
                  ),
              },

              items:
                cart,

              /*
               * Compatibility value.
               *
               * The server calculates the
               * real amount from Supabase.
               */
              totalPrice,
              couponCode:
                appliedCoupon?.couponCode || "",
            }),
          }
        );

      let orderResult: any;

      try {
        orderResult =
          await orderResponse.json();
      } catch {
        setMessage(
          "The server returned an invalid response while creating your order."
        );

        setProcessing(
          false
        );

        return;
      }

      if (
        !orderResponse.ok ||
        !orderResult.success
      ) {
        setMessage(
          orderResult.error ||
            "Could not create your order."
        );

        setProcessing(
          false
        );

        return;
      }

      const storeOrderId =
        orderResult.orderId;

      if (!storeOrderId) {
        setMessage(
          "Order was created, but the order ID was not returned."
        );

        setProcessing(
          false
        );

        return;
      }

      /*
       * ==========================================
       * STEP 2
       * USE SERVER-CALCULATED TOTAL
       * ==========================================
       */

      const serverAmount =
        Number(
          orderResult.amount
        );

      if (
        !Number.isFinite(
          serverAmount
        ) ||
        serverAmount <= 0
      ) {
        setMessage(
          "The server returned an invalid order amount."
        );

        setProcessing(
          false
        );

        return;
      }

      setMessage(
        "Opening secure payment..."
      );

      /*
       * ==========================================
       * STEP 3
       * CREATE RAZORPAY ORDER
       * ==========================================
       */

      const paymentResponse =
        await fetch(
          "/api/store-payment/create-order",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              orderId:
                storeOrderId,

              /*
               * The API now gets the
               * real amount from store_orders.
               */
              amount:
                serverAmount,
            }),
          }
        );

      let paymentResult: any;

      try {
        paymentResult =
          await paymentResponse.json();
      } catch {
        setMessage(
          "The payment server returned an invalid response."
        );

        setProcessing(
          false
        );

        return;
      }

      if (
        !paymentResponse.ok ||
        !paymentResult.success
      ) {
        setMessage(
          paymentResult.error ||
            "Could not start Razorpay payment."
        );

        setProcessing(
          false
        );

        return;
      }

      if (
        !paymentResult.razorpayOrderId
      ) {
        setMessage(
          "Razorpay order ID was not returned."
        );

        setProcessing(
          false
        );

        return;
      }

      /*
       * ==========================================
       * STEP 4
       * SAVE CHECKOUT INFORMATION
       * ==========================================
       */

      sessionStorage.setItem(
        "paperInkCheckout",
        JSON.stringify({
          customer: {
            name:
              name.trim(),

            mobile:
              mobile.replace(
                /\D/g,
                ""
              ),

            address:
              address.trim(),

            landmark:
              landmark.trim(),

            city:
              city.trim(),

            state:
              state.trim(),

            pinCode:
              pinCode.replace(
                /\D/g,
                ""
              ),
          },

          items:
            cart,

          totalItems,

          totalPrice:
            serverAmount,

          orderId:
            storeOrderId,

          razorpayOrderId:
            paymentResult.razorpayOrderId,
        })
      );

      /*
       * ==========================================
       * STEP 5
       * OPEN RAZORPAY
       * ==========================================
       */

      const openRazorpay =
        () => {
          const Razorpay =
            (window as any)
              .Razorpay;

          if (!Razorpay) {
            setMessage(
              "Razorpay could not be loaded. Please try again."
            );

            setProcessing(
              false
            );

            return;
          }

          const options = {
            key:
              paymentResult.keyId,

            amount:
              paymentResult.amount,

            currency:
              paymentResult.currency,

            name:
              "Image Tools",

            description:
              "A4 Paper & Printer Ink Order",

            order_id:
              paymentResult.razorpayOrderId,

            prefill: {
              name:
                name.trim(),

              contact:
                mobile.replace(
                  /\D/g,
                  ""
                ),
            },

            notes: {
              store_order_id:
                storeOrderId,
            },

            theme: {
              color:
                "#2563eb",
            },

            handler:
              async function (
                response: any
              ) {
                await handleSuccessfulPayment(
                  storeOrderId,
                  response
                );
              },

            modal: {
              ondismiss:
                function () {
                  setMessage(
                    "Payment window closed. Your order is still pending payment."
                  );

                  setProcessing(
                    false
                  );
                },
            },
          };

          const razorpay =
            new Razorpay(
              options
            );

          razorpay.on(
            "payment.failed",
            function (
              response: any
            ) {
              console.error(
                "Razorpay payment failed:",
                response
              );

              setMessage(
                "Payment failed. Please try again."
              );

              setProcessing(
                false
              );
            }
          );

          razorpay.open();
        };

      /*
       * ==========================================
       * RAZORPAY SCRIPT
       * ==========================================
       */

      if (
        (window as any)
          .Razorpay
      ) {
        openRazorpay();

        return;
      }

      const existingScript =
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );

      if (
        existingScript
      ) {
        existingScript.addEventListener(
          "load",
          openRazorpay,
          {
            once:
              true,
          }
        );

        return;
      }

      const razorpayScript =
        document.createElement(
          "script"
        );

      razorpayScript.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      razorpayScript.async =
        true;

      razorpayScript.onload =
        () => {
          openRazorpay();
        };

      razorpayScript.onerror =
        () => {
          setMessage(
            "Unable to load Razorpay. Please check your internet connection and try again."
          );

          setProcessing(
            false
          );
        };

      document.body.appendChild(
        razorpayScript
      );
    } catch (error) {
      console.error(
        "Store checkout error:",
        error
      );

      setMessage(
        "Something went wrong while starting payment."
      );

      setProcessing(
        false
      );
    }
  }

  if (!loaded) {
    return (
      <main
        style={{
          minHeight:
            "100vh",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          background:
            "#f8fafc",
          padding:
            "20px",
          color:
            "#1e3a8a",
          fontWeight:
            "bold",
        }}
      >
        Loading checkout...
      </main>
    );
  }

  if (
    cart.length === 0
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",
          background:
            "linear-gradient(135deg, #eef4ff, #f8fbff)",
          padding:
            "50px 20px",
        }}
      >
        <div
          style={{
            maxWidth:
              "600px",
            margin:
              "0 auto",
            background:
              "white",
            padding:
              "40px 25px",
            borderRadius:
              "16px",
            textAlign:
              "center",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize:
                "55px",
            }}
          >
            🛒
          </div>

          <h1
            style={{
              color:
                "#1e3a8a",
            }}
          >
            Your cart is empty
          </h1>

          <p
            style={{
              color:
                "#666",
              lineHeight:
                1.6,
            }}
          >
            Please add paper or printer ink
            before checkout.
          </p>

          {message && (
            <div
              style={{
                marginTop:
                  "15px",
                padding:
                  "12px",
                background:
                  "#fee2e2",
                color:
                  "#b91c1c",
                borderRadius:
                  "8px",
                lineHeight:
                  1.5,
                textAlign:
                  "left",
              }}
            >
              {message}
            </div>
          )}

          <Link
            href="/paper-ink-store"
            style={{
              display:
                "inline-block",
              marginTop:
                "15px",
              padding:
                "12px 22px",
              background:
                "#2563eb",
              color:
                "white",
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
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",
        background:
          "linear-gradient(135deg, #eef4ff, #f8fbff)",
        padding:
          "40px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth:
            "1000px",
          margin:
            "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap:
              "15px",
            flexWrap:
              "wrap",
            marginBottom:
              "30px",
          }}
        >
          <div>
            <h1
              style={{
                color:
                  "#1e3a8a",
                margin:
                  "0 0 8px",
              }}
            >
              🧾 Checkout
            </h1>

            <p
              style={{
                color:
                  "#666",
                margin: 0,
              }}
            >
              Enter your delivery details
            </p>
          </div>

          <Link
            href="/paper-ink-store/cart"
            style={{
              padding:
                "10px 17px",
              background:
                "#2563eb",
              color:
                "white",
              textDecoration:
                "none",
              borderRadius:
                "8px",
              fontWeight:
                "bold",
            }}
          >
            ← Back to Cart
          </Link>
        </div>

        <div
          className="paper-ink-checkout-grid"
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(0, 1.5fr) minmax(280px, 1fr)",
            gap:
              "25px",
            alignItems:
              "start",
          }}
        >
          {/* CUSTOMER FORM */}

          <section
            style={{
              background:
                "white",
              padding:
                "25px",
              borderRadius:
                "16px",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                color:
                  "#1e3a8a",
                marginTop:
                  0,
                marginBottom:
                  "22px",
              }}
            >
              📦 Delivery Details
            </h2>
            {/* COUPON CODE */}

<div
  style={{
    marginBottom: "22px",
    padding: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  }}
>
  <strong
    style={{
      display: "block",
      color: "#1e3a8a",
      marginBottom: "10px",
    }}
  >
    🎟️ Have a Coupon Code?
  </strong>

  <div
    style={{
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    }}
  >
    <input
      type="text"
      value={couponCode}
      onChange={(e) => {
        setCouponCode(e.target.value.toUpperCase());
        setAppliedCoupon(null);
        setCouponMessage("");
      }}
      placeholder="Enter coupon code"
      disabled={couponLoading || processing}
      style={{
        flex: "1",
        minWidth: "150px",
        padding: "11px",
        border: "1px solid #cbd5e1",
        borderRadius: "7px",
        fontSize: "14px",
        boxSizing: "border-box",
      }}
    />

    <button
      type="button"
      onClick={handleApplyCoupon}
      disabled={couponLoading || processing}
      style={{
        padding: "11px 18px",
        border: "none",
        borderRadius: "7px",
        background: "#2563eb",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      {couponLoading ? "Checking..." : "Apply"}
    </button>
  </div>

  {couponMessage && (
    <p
      style={{
        margin: "10px 0 0",
        fontSize: "13px",
        color: appliedCoupon ? "#15803d" : "#b91c1c",
        lineHeight: 1.5,
      }}
    >
      {couponMessage}
    </p>
  )}
</div>

            <label
              style={
                labelStyle
              }
            >
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Enter your full name"
              autoComplete="name"
              style={
                inputStyle
              }
            />

            <label
              style={
                labelStyle
              }
            >
              Mobile Number
            </label>

            <input
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={(e) => {
               const newMobile = e.target.value
               .replace(/\D/g, "")
               .slice(0, 10);

              setMobile(newMobile);

          if (newMobile !== mobile && appliedCoupon) {
            setAppliedCoupon(null);
            setCouponMessage(
           "Mobile number changed. Please apply the coupon again."
         );
        }
      }}
              placeholder="10-digit mobile number"
              maxLength={
                10
              }
              autoComplete="tel"
              style={
                inputStyle
              }
            />

            <label
              style={
                labelStyle
              }
            >
              Complete Address
            </label>

            <textarea
              value={address}
              onChange={(e) =>
                setAddress(
                  e.target.value
                )
              }
              placeholder="House/Flat number, street, area"
              rows={4}
              autoComplete="street-address"
              style={{
                ...inputStyle,
                resize:
                  "vertical",
                minHeight:
                  "110px",
              }}
            />

            <label
              style={
                labelStyle
              }
            >
              Landmark
            </label>

            <input
              type="text"
              value={landmark}
              onChange={(e) =>
                setLandmark(
                  e.target.value
                )
              }
              placeholder="Nearby landmark (optional)"
              autoComplete="off"
              style={
                inputStyle
              }
            />

            <label
              style={
                labelStyle
              }
            >
              City
            </label>

            <input
              type="text"
              value={city}
              onChange={(e) =>
                setCity(
                  e.target.value
                )
              }
              placeholder="Enter city"
              autoComplete="address-level2"
              style={
                inputStyle
              }
            />

            <label
              style={
                labelStyle
              }
            >
              State
            </label>

            <input
              type="text"
              value={state}
              onChange={(e) =>
                setState(
                  e.target.value
                )
              }
              placeholder="Enter state"
              autoComplete="address-level1"
              style={
                inputStyle
              }
            />

            <label
              style={
                labelStyle
              }
            >
              PIN Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={pinCode}
              onChange={(e) =>
                setPinCode(
                  e.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(
                      0,
                      6
                    )
                )
              }
              placeholder="6-digit PIN code"
              maxLength={
                6
              }
              autoComplete="postal-code"
              style={
                inputStyle
              }
            />

            {message && (
              <div
                style={{
                  marginTop:
                    "18px",
                  padding:
                    "12px",
                  borderRadius:
                    "8px",
                  background:
                    message.includes(
                      "Creating"
                    ) ||
                    message.includes(
                      "Opening"
                    ) ||
                    message.includes(
                      "Verifying"
                    )
                      ? "#eff6ff"
                      : message.includes(
                          "Payment"
                        ) &&
                        !message.includes(
                          "failed"
                        )
                      ? "#fff7ed"
                      : "#fee2e2",
                  color:
                    message.includes(
                      "Creating"
                    ) ||
                    message.includes(
                      "Opening"
                    ) ||
                    message.includes(
                      "Verifying"
                    )
                      ? "#1d4ed8"
                      : message.includes(
                          "Payment"
                        ) &&
                        !message.includes(
                          "failed"
                        )
                      ? "#9a3412"
                      : "#b91c1c",
                  lineHeight:
                    1.5,
                }}
              >
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={
                handleContinue
              }
              disabled={
                processing
              }
              style={{
                width:
                  "100%",
                marginTop:
                  "20px",
                padding:
                  "15px",
                border:
                  "none",
                borderRadius:
                  "10px",
                background:
                  processing
                    ? "#94a3b8"
                    : "#16a34a",
                color:
                  "white",
                fontSize:
                  "17px",
                fontWeight:
                  "bold",
                cursor:
                  processing
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {processing
                ? "⏳ Processing..."
                : "Continue to Payment →"}
            </button>
          </section>

          {/* ORDER SUMMARY */}

          <section
            style={{
              background:
                "white",
              padding:
                "25px",
              borderRadius:
                "16px",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.08)",
              height:
                "fit-content",
            }}
          >
            <h2
              style={{
                color:
                  "#1e3a8a",
                marginTop:
                  0,
                marginBottom:
                  "20px",
              }}
            >
              🛒 Order Summary
            </h2>

            <div
              style={{
                display:
                  "grid",
                gap:
                  "15px",
              }}
            >
              {cart.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    style={{
                      paddingBottom:
                        "15px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>
                      {
                        item.name
                      }
                    </strong>

                    {item.gsm !==
                      null && (
                      <div
                        style={{
                          fontSize:
                            "13px",
                          color:
                            "#666",
                          marginTop:
                            "4px",
                        }}
                      >
                        {
                          item.gsm
                        }{" "}
                        GSM
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
                        {
                          item.pack_size
                        }
                      </div>
                    )}

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap:
                          "15px",
                        marginTop:
                          "7px",
                      }}
                    >
                      <span>
                        Qty:{" "}
                        {
                          item.quantity
                        }
                      </span>

                      <strong>
                        ₹
                        {(
                          item.price *
                          item.quantity
                        ).toFixed(
                          2
                        )}
                      </strong>
                    </div>
                  </div>
                )
              )}
            </div>

            <div
             style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "20px",
              paddingTop: "18px",
              borderTop: "2px solid #ddd",
           }}
         >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
         <strong>₹{totalPrice.toFixed(2)}</strong>
       </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
         <span style={{ color: "#16a34a" }}>Coupon Discount</span>
         <strong style={{ color: "#16a34a" }}>
          - ₹{Number(appliedCoupon?.discount || 0).toFixed(2)}
        </strong>
      </div>

      <div
       style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "12px",
        borderTop: "1px solid #ddd",
        fontSize: "21px",
     }}
   >
     <strong>Payable Total</strong>
     <strong style={{ color: "#16a34a" }}>
       ₹{Math.max(
        0,
        totalPrice - Number(appliedCoupon?.discount || 0)
      ).toFixed(2)}
    </strong>
  </div>
</div>

            <div
              style={{
                marginTop:
                  "15px",
                padding:
                  "12px",
                background:
                  "#f0fdf4",
                borderRadius:
                  "8px",
                color:
                  "#166534",
                fontSize:
                  "14px",
                fontWeight:
                  "bold",
              }}
            >
              📦{" "}
              {totalItems}{" "}
              {totalItems ===
              1
                ? "item"
                : "items"}{" "}
              in your order
            </div>

            <p
              style={{
                fontSize:
                  "13px",
                color:
                  "#777",
                marginTop:
                  "15px",
                lineHeight:
                  1.5,
              }}
            >
              Payment will be securely
              processed through Razorpay
              after your delivery details
              are confirmed.
            </p>
          </section>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          main {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }

          .paper-ink-checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          main {
            padding-top: 25px !important;
          }
        }
      `}</style>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "bold",
  marginBottom: "7px",
  color: "#1f2937",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  border:
    "1px solid #d1d5db",
  borderRadius:
    "8px",
  marginBottom:
    "18px",
  fontSize:
    "15px",
  outline:
    "none",
  boxSizing:
    "border-box",
  background:
    "#ffffff",
  color:
    "#111827",
};