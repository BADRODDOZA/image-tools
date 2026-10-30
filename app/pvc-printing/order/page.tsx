"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type CardItem = {
  id: string;
  cardType: string;
  quantity: number;
  frontFile: File | null;
  backFile: File | null;
};

const BASE_PRICE = 75;

const cardTypes = [
  "Aadhaar PVC Card",
  "PAN PVC Card",
  "Driving Licence PVC Card",
  "Voter ID PVC Card",
  "Passport PVC Card",
  "Employee ID Card",
  "Student ID Card",
  "Membership Card",
  "Other PVC Card",
];

function getDiscountPercent(quantity: number) {
  if (quantity >= 50) {
    return 50;
  }

  if (quantity >= 20) {
    return 36;
  }

  if (quantity >= 6) {
    return 28;
  }

  return 0;
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export default function PVCPrintingOrderPage() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [cards, setCards] = useState<CardItem[]>([
    {
      id: crypto.randomUUID(),
      cardType: "",
      quantity: 1,
      frontFile: null,
      backFile: null,
    },
  ]);

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalQuantity = cards.reduce(
    (total, card) => total + card.quantity,
    0
  );

  const subtotal = totalQuantity * BASE_PRICE;

  const discountPercent = getDiscountPercent(totalQuantity);

  const discountAmount = Math.round(
    (subtotal * discountPercent) / 100
  );

  const totalAmount = subtotal - discountAmount;

  function addCard() {
    setCards((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        cardType: "",
        quantity: 1,
        frontFile: null,
        backFile: null,
      },
    ]);
  }

  function removeCard(id: string) {
    if (cards.length === 1) {
      return;
    }

    setCards((previous) =>
      previous.filter((card) => card.id !== id)
    );
  }

  function updateCardType(id: string, value: string) {
    setCards((previous) =>
      previous.map((card) =>
        card.id === id
          ? {
              ...card,
              cardType: value,
            }
          : card
      )
    );
  }

  function updateQuantity(id: string, value: number) {
    const quantity = Math.max(1, value || 1);

    setCards((previous) =>
      previous.map((card) =>
        card.id === id
          ? {
              ...card,
              quantity,
            }
          : card
      )
    );
  }

  function updateFrontFile(id: string, file: File | null) {
    setCards((previous) =>
      previous.map((card) =>
        card.id === id
          ? {
              ...card,
              frontFile: file,
            }
          : card
      )
    );
  }

  function updateBackFile(id: string, file: File | null) {
    setCards((previous) =>
      previous.map((card) =>
        card.id === id
          ? {
              ...card,
              backFile: file,
            }
          : card
      )
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!customerName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      alert("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter your address.");
      return;
    }

    if (!city.trim()) {
      alert("Please enter your city.");
      return;
    }

    if (!state) {
      alert("Please select your state.");
      return;
    }

    if (state !== "West Bengal") {
      alert(
        "PVC Printing service is currently available only in West Bengal."
      );
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (!accepted) {
      alert("Please accept the declaration before continuing.");
      return;
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      if (!card.cardType) {
        alert(`Please select card type for Card ${i + 1}.`);
        return;
      }

      if (!card.frontFile) {
        alert(`Please upload the front document for Card ${i + 1}.`);
        return;
      }
    }

    try {
      setLoading(true);

      const razorpayLoaded = await loadRazorpay();

      if (!razorpayLoaded) {
        alert(
          "Razorpay could not be loaded. Please check your internet connection and try again."
        );
        setLoading(false);
        return;
      }

      /*
       * STEP 1
       * Create Razorpay order
       */
      const createOrderResponse = await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantities: cards.map((card) => card.quantity),
            state,
          }),
        }
      );

      const createOrderData =
        await createOrderResponse.json();

      if (!createOrderResponse.ok) {
        throw new Error(
          createOrderData?.error ||
            "Unable to create Razorpay order."
        );
      }

      const razorpayOrderId = createOrderData.orderId;

      /*
       * STEP 2
       * Open Razorpay
       */
      const options = {
        key: createOrderData.keyId,
        amount: createOrderData.amount,
        currency: "INR",
        name: "Image Tools",
        description: "PVC Card Printing",
        order_id: razorpayOrderId,

        prefill: {
          name: customerName,
          contact: mobile,
        },

        notes: {
          service: "PVC Printing",
          location: "West Bengal",
        },

        theme: {
          color: "#2563eb",
        },

        handler: async function (response: any) {
          try {
            setLoading(true);

            /*
             * STEP 3
             * Verify Razorpay payment
             */
            const verifyResponse = await fetch(
              "/api/razorpay/verify-payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,

                  amount: totalAmount,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData?.error ||
                  "Payment verification failed."
              );
            }

            /*
             * STEP 4
             * Create our own application order ID
             */
            const orderId = crypto.randomUUID();

            /*
             * STEP 5
             * Create parent order in Supabase
             */
            const { error: orderError } =
              await supabase.from("pvc_orders").insert({
                id: orderId,
                customer_name: customerName.trim(),
                mobile,
                email: "",
                address: address.trim(),
                city: city.trim(),
                state: "West Bengal",
                pincode,
                card_type: "Multiple PVC Cards",
                document_url: "",
                quantity: totalQuantity,
                amount: totalAmount,
                status: "Paid",
                payment_status: "Paid",
              });

            if (orderError) {
              console.error(
                "Supabase order error:",
                orderError
              );

              throw new Error(
                "Payment was successful, but the order could not be saved."
              );
            }

            const uploadedFiles: string[] = [];

            /*
             * STEP 6
             * Upload files + create child items
             */
            for (let index = 0; index < cards.length; index++) {
              const card = cards[index];

              if (!card.frontFile) {
                throw new Error(
                  `Front document missing for Card ${index + 1}.`
                );
              }

              const cardNumber = index + 1;

              const frontExtension =
                card.frontFile.name.split(".").pop() ||
                "file";

              const frontPath =
                `${orderId}/card-${cardNumber}/front.${frontExtension}`;

              const { error: frontUploadError } =
                await supabase.storage
                  .from("pvc-documents")
                  .upload(
                    frontPath,
                    card.frontFile,
                    {
                      upsert: false,
                    }
                  );

              if (frontUploadError) {
                console.error(
                  "Front upload error:",
                  frontUploadError
                );

                throw new Error(
                  `Unable to upload front document for Card ${cardNumber}.`
                );
              }

              uploadedFiles.push(frontPath);

              let backPath = "";

              if (card.backFile) {
                const backExtension =
                  card.backFile.name.split(".").pop() ||
                  "file";

                backPath =
                  `${orderId}/card-${cardNumber}/back.${backExtension}`;

                const { error: backUploadError } =
                  await supabase.storage
                    .from("pvc-documents")
                    .upload(
                      backPath,
                      card.backFile,
                      {
                        upsert: false,
                      }
                    );

                if (backUploadError) {
                  console.error(
                    "Back upload error:",
                    backUploadError
                  );

                  throw new Error(
                    `Unable to upload back document for Card ${cardNumber}.`
                  );
                }

                uploadedFiles.push(backPath);
              }

              /*
               * Create child item
               */
              const { error: itemError } =
                await supabase
                  .from("pvc_order_items")
                  .insert({
                    order_id: orderId,
                    card_type: card.cardType,
                    front_document_url: frontPath,
                    back_document_url: backPath,
                    quantity: card.quantity,
                  });

              if (itemError) {
                console.error(
                  "Order item error:",
                  itemError
                );

                throw new Error(
                  `Unable to save Card ${cardNumber}.`
                );
              }
            }

            /*
             * STEP 7
             * Go to confirmation page
             */
            router.push(
              `/pvc-printing/order/confirmation?orderId=${encodeURIComponent(
                orderId
              )}&paymentId=${encodeURIComponent(
                response.razorpay_payment_id
              )}&razorpayOrderId=${encodeURIComponent(
                response.razorpay_order_id
              )}`
            );
          } catch (error: any) {
            console.error(
              "Order processing error:",
              error
            );

            alert(
              error?.message ||
                "Something went wrong while saving your order."
            );

            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          alert(
            response?.error?.description ||
              "Payment failed. Please try again."
          );

          setLoading(false);
        }
      );

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);

      alert(
        error?.message ||
          "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eef4ff 0%, #f8fbff 100%)",
        padding: "40px 20px 70px",
      }}
    >
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#e8f0ff",
              color: "#1d4ed8",
              padding: "8px 16px",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "14px",
              marginBottom: "14px",
            }}
          >
            🇮🇳 West Bengal Only • PVC Printing
          </div>

          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 46px)",
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 12px",
            }}
          >
            PVC Card Printing Order
          </h1>

          <p
            style={{
              color: "#64748b",
              fontSize: "17px",
              margin: 0,
            }}
          >
            Order your PVC cards online easily and securely.
          </p>

          <p
            style={{
              color: "#dc2626",
              fontSize: "15px",
              fontWeight: 700,
              marginTop: "10px",
            }}
          >
            PVC Printing service is currently available only
            in West Bengal.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* CUSTOMER DETAILS */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              marginBottom: "22px",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                fontSize: "24px",
                color: "#111827",
              }}
            >
              👤 Customer Details
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  Full Name *
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  placeholder="Enter your full name"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Mobile Number *
                </label>

                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <label style={labelStyle}>
                  Full Address *
                </label>

                <textarea
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  placeholder="Enter your complete address"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  City *
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  placeholder="Enter city"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  State *
                </label>

                <select
                  value={state}
                  onChange={(e) =>
                    setState(e.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select state
                  </option>

                  <option value="West Bengal">
                    West Bengal
                  </option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  PIN Code *
                </label>

                <input
                  type="text"
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="6-digit PIN code"
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          {/* PVC CARDS */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              marginBottom: "22px",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    color: "#111827",
                  }}
                >
                  🪪 PVC Cards
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                  }}
                >
                  Add one or multiple PVC cards.
                </p>
              </div>

              <button
                type="button"
                onClick={addCard}
                style={{
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  padding: "11px 18px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add Another Card
              </button>
            </div>

            {cards.map((card, index) => (
              <div
                key={card.id}
                style={{
                  border: "1px solid #dbeafe",
                  background: "#f8fbff",
                  borderRadius: "16px",
                  padding: "20px",
                  marginBottom:
                    index === cards.length - 1
                      ? 0
                      : "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: "#1e3a8a",
                      fontSize: "18px",
                    }}
                  >
                    Card {index + 1}
                  </h3>

                  {cards.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeCard(card.id)
                      }
                      style={{
                        border: "none",
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Card Type *
                    </label>

                    <select
                      value={card.cardType}
                      onChange={(e) =>
                        updateCardType(
                          card.id,
                          e.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Select card type
                      </option>

                      {cardTypes.map((type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Quantity *
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={card.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          card.id,
                          Number(e.target.value)
                        )
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Front Document *
                    </label>

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        updateFrontFile(
                          card.id,
                          e.target.files?.[0] || null
                        )
                      }
                      style={fileInputStyle}
                    />

                    {card.frontFile && (
                      <p
                        style={{
                          marginTop: "7px",
                          color: "#16a34a",
                          fontSize: "13px",
                        }}
                      >
                        ✓ {card.frontFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Back Document
                    </label>

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        updateBackFile(
                          card.id,
                          e.target.files?.[0] || null
                        )
                      }
                      style={fileInputStyle}
                    />

                    {card.backFile && (
                      <p
                        style={{
                          marginTop: "7px",
                          color: "#16a34a",
                          fontSize: "13px",
                        }}
                      >
                        ✓ {card.backFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* DISCOUNT INFO */}
          <section
            style={{
              background:
                "linear-gradient(135deg, #eff6ff, #ffffff)",
              borderRadius: "20px",
              padding: "24px",
              marginBottom: "22px",
              border: "1px solid #bfdbfe",
            }}
          >
            <h2
              style={{
                margin: "0 0 15px",
                fontSize: "21px",
                color: "#1e3a8a",
              }}
            >
              🎁 Bulk Order Discounts
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "10px",
              }}
            >
              <div style={discountBoxStyle}>
                <strong>6+ Cards</strong>
                <span>28% OFF</span>
              </div>

              <div style={discountBoxStyle}>
                <strong>20+ Cards</strong>
                <span>36% OFF</span>
              </div>

              <div style={discountBoxStyle}>
                <strong>50+ Cards</strong>
                <span>50% OFF</span>
              </div>
            </div>
          </section>

          {/* ORDER SUMMARY */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              marginBottom: "22px",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                fontSize: "24px",
                color: "#111827",
              }}
            >
              💰 Order Summary
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <SummaryRow
                label="Price per card"
                value={`₹${BASE_PRICE}`}
              />

              <SummaryRow
                label={`Total cards (${totalQuantity})`}
                value={`₹${subtotal}`}
              />

              <SummaryRow
                label={`Discount (${discountPercent}%)`}
                value={`- ₹${discountAmount}`}
                discount
              />

              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "15px",
                  marginTop: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                <span>Total Amount</span>

                <span style={{ color: "#2563eb" }}>
                  ₹{totalAmount}
                </span>
              </div>
            </div>
          </section>

          {/* DECLARATION */}
          <section
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "22px",
            }}
          >
            <label
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                cursor: "pointer",
                color: "#7c2d12",
                lineHeight: 1.6,
              }}
            >
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) =>
                  setAccepted(e.target.checked)
                }
                style={{
                  width: "19px",
                  height: "19px",
                  marginTop: "3px",
                }}
              />

              <span>
                I confirm that the documents/content I
                provide are genuine and belong to me or I
                have permission to submit them. I understand
                that this service only prints the supplied
                content onto PVC cards and does not issue,
                modify, authenticate, or create government
                documents.
              </span>
            </label>
          </section>

          {/* PAYMENT */}
          <section
            style={{
              background:
                "linear-gradient(135deg, #eff6ff, #dbeafe)",
              borderRadius: "20px",
              padding: "28px",
              textAlign: "center",
              border: "1px solid #bfdbfe",
            }}
          >
            <div
              style={{
                fontSize: "35px",
                marginBottom: "8px",
              }}
            >
              🔐
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "25px",
                color: "#111827",
              }}
            >
              Secure Payment
            </h2>

            <p
              style={{
                color: "#475569",
                margin: "0 0 20px",
              }}
            >
              Pay securely using Razorpay.
            </p>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                maxWidth: "500px",
                border: "none",
                background: loading
                  ? "#94a3b8"
                  : "#2563eb",
                color: "#ffffff",
                padding: "16px 25px",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: 800,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                boxShadow:
                  "0 8px 20px rgba(37, 99, 235, 0.25)",
              }}
            >
              {loading
                ? "Processing..."
                : `Pay ₹${totalAmount} & Place Order`}
            </button>

            <p
              style={{
                margin: "14px 0 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              🇮🇳 PVC Printing is currently available only
              in West Bengal.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  discount = false,
}: {
  label: string;
  value: string;
  discount?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        color: discount ? "#16a34a" : "#475569",
        fontWeight: discount ? 700 : 500,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "7px",
  fontWeight: 700,
  color: "#374151",
  fontSize: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  fontSize: "15px",
  color: "#111827",
  outline: "none",
};

const fileInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  fontSize: "14px",
};

const discountBoxStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  color: "#1e3a8a",
};