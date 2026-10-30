
"use client";

import { useEffect, useState } from "react";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  customer_type: "new" | "vip" | "both";
  minimum_order_amount: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  per_customer_limit: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  used_count?: number;
};

type CouponForm = {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  customer_type: "new" | "vip" | "both";
  minimum_order_amount: string;
  maximum_discount: string;
  usage_limit: string;
  per_customer_limit: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};

const emptyForm: CouponForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "10",
  customer_type: "new",
  minimum_order_amount: "0",
  maximum_discount: "",
  usage_limit: "",
  per_customer_limit: "1",
  starts_at: new Date().toISOString().slice(0, 16),
  expires_at: "",
  is_active: true,
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

function formatDate(value: string | null) {
  if (!value) return "No expiry";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function StoreCouponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [password, setPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadCoupons(adminPassword: string) {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/store-coupons", {
        headers: {
          "x-admin-password": adminPassword,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load coupons.");
      }

      setCoupons(result.coupons || []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load coupons."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedPassword = sessionStorage.getItem("storeAdminPassword");

    if (storedPassword) {
      setSavedPassword(storedPassword);
      setLoggedIn(true);
      loadCoupons(storedPassword);
    }
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/store-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Invalid admin password.");
      }

      sessionStorage.setItem("storeAdminPassword", password);
      setSavedPassword(password);
      setLoggedIn(true);
      await loadCoupons(password);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof CouponForm>(
    key: K,
    value: CouponForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      starts_at: new Date().toISOString().slice(0, 16),
    });
  }

  function editCoupon(coupon: Coupon) {
    setEditingId(coupon.id);

    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      customer_type: coupon.customer_type,
      minimum_order_amount: String(coupon.minimum_order_amount),
      maximum_discount:
        coupon.maximum_discount === null
          ? ""
          : String(coupon.maximum_discount),
      usage_limit:
        coupon.usage_limit === null ? "" : String(coupon.usage_limit),
      per_customer_limit: String(coupon.per_customer_limit),
      starts_at: toLocalDateTime(coupon.starts_at),
      expires_at: toLocalDateTime(coupon.expires_at),
      is_active: coupon.is_active,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      discount_value: Number(form.discount_value),
      minimum_order_amount: Number(form.minimum_order_amount),
      maximum_discount: form.maximum_discount || null,
      usage_limit: form.usage_limit || null,
      per_customer_limit: Number(form.per_customer_limit),
      starts_at: new Date(form.starts_at).toISOString(),
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
    };

    try {
      const response = await fetch("/api/admin/store-coupons", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": savedPassword,
        },
        body: JSON.stringify(
          editingId ? { ...payload, id: editingId } : payload
        ),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save coupon.");
      }

      setMessage(
        editingId
          ? "Coupon updated successfully."
          : "Coupon created successfully."
      );

      resetForm();
      await loadCoupons(savedPassword);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save coupon."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    setErrorMessage("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/store-coupons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": savedPassword,
        },
        body: JSON.stringify({
          id: coupon.id,
          is_active: !coupon.is_active,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update coupon.");
      }

      setMessage(
        coupon.is_active
          ? "Coupon deactivated."
          : "Coupon activated."
      );

      await loadCoupons(savedPassword);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update coupon."
      );
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    const confirmed = window.confirm(
      `Are you sure you want to delete coupon ${coupon.code}?`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/store-coupons", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": savedPassword,
        },
        body: JSON.stringify({ id: coupon.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete coupon.");
      }

      setMessage("Coupon deleted successfully.");
      await loadCoupons(savedPassword);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete coupon."
      );
    }
  }

  function logout() {
    sessionStorage.removeItem("storeAdminPassword");
    setSavedPassword("");
    setPassword("");
    setLoggedIn(false);
    setCoupons([]);
    resetForm();
  }

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(search.toLowerCase()) ||
      (coupon.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && coupon.is_active) ||
      (filter === "inactive" && !coupon.is_active) ||
      coupon.customer_type === filter;

    return matchesSearch && matchesFilter;
  });

  const activeCount = coupons.filter((coupon) => coupon.is_active).length;
  const totalUses = coupons.reduce(
    (total, coupon) => total + (coupon.used_count || 0),
    0
  );

  const styles = {
    page: {
      maxWidth: "1250px",
      margin: "0 auto",
      padding: "24px 16px 60px",
      color: "#172033",
    } as React.CSSProperties,
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "22px",
      marginBottom: "22px",
      boxShadow: "0 3px 12px rgba(15,23,42,0.04)",
    } as React.CSSProperties,
    input: {
      width: "100%",
      padding: "11px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "14px",
      boxSizing: "border-box",
      background: "#ffffff",
      color: "#172033",
    } as React.CSSProperties,
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 700,
      marginBottom: "7px",
      color: "#334155",
    } as React.CSSProperties,
    button: {
      padding: "10px 16px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: "13px",
    } as React.CSSProperties,
  };

  if (!loggedIn) {
    return (
      <main style={styles.page}>
        <div style={{ ...styles.card, maxWidth: "420px", margin: "70px auto" }}>
          <h1 style={{ fontSize: "25px", marginTop: 0 }}>
            Store Coupon Admin
          </h1>

          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Login to manage A4 Paper and Printer Ink coupons.
          </p>

          {errorMessage && (
            <p style={{ color: "#dc2626", fontSize: "14px" }}>
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleLogin}>
            <label style={styles.label}>Admin Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={styles.input}
              placeholder="Enter admin password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                width: "100%",
                marginTop: "16px",
                background: "#2563eb",
                color: "#ffffff",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "29px", margin: 0 }}>
            Coupon Management
          </h1>
          <p style={{ color: "#64748b", marginBottom: 0 }}>
            Manage welcome offers and VIP promotions for your store.
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            ...styles.button,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          Logout
        </button>
      </div>

      {message && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "12px 15px",
            borderRadius: "9px",
            marginBottom: "15px",
          }}
        >
          {message}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px 15px",
            borderRadius: "9px",
            marginBottom: "15px",
          }}
        >
          {errorMessage}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Coupons", value: coupons.length },
          { label: "Active Coupons", value: activeCount },
          { label: "Total Redemptions", value: totalUses },
        ].map((item) => (
          <div key={item.label} style={styles.card}>
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
              {item.label}
            </p>
            <strong style={{ fontSize: "28px" }}>{item.value}</strong>
          </div>
        ))}
      </section>

      <section style={styles.card}>
        <h2 style={{ marginTop: 0, fontSize: "21px" }}>
          {editingId ? "Edit Coupon" : "Create New Coupon"}
        </h2>

        <p style={{ color: "#64748b", fontSize: "13px" }}>
          New customers can use welcome coupons once per customer. VIP
          promotions are only available when you create and activate them.
        </p>

        <form onSubmit={saveCoupon}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label style={styles.label}>Coupon Code *</label>
              <input
                style={styles.input}
                value={form.code}
                onChange={(event) =>
                  updateField("code", event.target.value.toUpperCase())
                }
                placeholder="WELCOME10"
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_-]+"
                required
              />
            </div>

            <div>
              <label style={styles.label}>Description</label>
              <input
                style={styles.input}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Welcome discount for new customers"
              />
            </div>

            <div>
              <label style={styles.label}>Discount Type *</label>
              <select
                style={styles.input}
                value={form.discount_type}
                onChange={(event) =>
                  updateField(
                    "discount_type",
                    event.target.value as "percentage" | "fixed"
                  )
                }
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Discount Value *</label>
              <input
                style={styles.input}
                type="number"
                min="0.01"
                max={form.discount_type === "percentage" ? "100" : undefined}
                step="0.01"
                value={form.discount_value}
                onChange={(event) =>
                  updateField("discount_value", event.target.value)
                }
                required
              />
            </div>

            <div>
              <label style={styles.label}>Eligible Customer *</label>
              <select
                style={styles.input}
                value={form.customer_type}
                onChange={(event) =>
                  updateField(
                    "customer_type",
                    event.target.value as "new" | "vip" | "both"
                  )
                }
              >
                <option value="new">New Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="both">Both New and VIP</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Minimum Order Amount (₹)</label>
              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.minimum_order_amount}
                onChange={(event) =>
                  updateField("minimum_order_amount", event.target.value)
                }
                required
              />
            </div>

            <div>
              <label style={styles.label}>Maximum Discount (₹)</label>
              <input
                style={styles.input}
                type="number"
                min="0.01"
                step="0.01"
                value={form.maximum_discount}
                onChange={(event) =>
                  updateField("maximum_discount", event.target.value)
                }
                placeholder="Leave empty for no limit"
              />
            </div>

            <div>
              <label style={styles.label}>Total Usage Limit</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                step="1"
                value={form.usage_limit}
                onChange={(event) =>
                  updateField("usage_limit", event.target.value)
                }
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label style={styles.label}>Uses Per Customer</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                step="1"
                value={form.per_customer_limit}
                onChange={(event) =>
                  updateField("per_customer_limit", event.target.value)
                }
                required
              />
            </div>

            <div>
              <label style={styles.label}>Start Date and Time *</label>
              <input
                style={styles.input}
                type="datetime-local"
                value={form.starts_at}
                onChange={(event) =>
                  updateField("starts_at", event.target.value)
                }
                required
              />
            </div>

            <div>
              <label style={styles.label}>Expiry Date and Time</label>
              <input
                style={styles.input}
                type="datetime-local"
                value={form.expires_at}
                onChange={(event) =>
                  updateField("expires_at", event.target.value)
                }
              />
            </div>

            <div>
              <label style={styles.label}>Coupon Status</label>
              <select
                style={styles.input}
                value={form.is_active ? "true" : "false"}
                onChange={(event) =>
                  updateField("is_active", event.target.value === "true")
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "22px",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.button,
                background: "#2563eb",
                color: "#ffffff",
                minWidth: "145px",
              }}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Coupon"
                  : "Create Coupon"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...styles.button,
                  background: "#e2e8f0",
                  color: "#334155",
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={{ marginTop: 0, fontSize: "21px" }}>
          All Coupons
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <input
            style={styles.input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search coupon code or description..."
          />

          <select
            style={styles.input}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All Coupons</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="new">New Customers</option>
            <option value="vip">VIP Customers</option>
            <option value="both">Both Customer Types</option>
          </select>

          <button
            onClick={() => loadCoupons(savedPassword)}
            disabled={loading}
            style={{
              ...styles.button,
              background: "#e0e7ff",
              color: "#3730a3",
            }}
          >
            {loading ? "Refreshing..." : "Refresh Coupons"}
          </button>
        </div>

        {loading && coupons.length === 0 ? (
          <p>Loading coupons...</p>
        ) : filteredCoupons.length === 0 ? (
          <p style={{ color: "#64748b" }}>No coupons found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "850px",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  {[
                    "Coupon",
                    "Discount",
                    "Customer",
                    "Usage",
                    "Expiry",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{ padding: "12px", whiteSpace: "nowrap" }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCoupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={{ padding: "13px 12px" }}>
                      <strong>{coupon.code}</strong>
                      <div style={{ color: "#64748b", marginTop: "4px" }}>
                        {coupon.description || "No description"}
                      </div>
                    </td>

                    <td style={{ padding: "13px 12px" }}>
                      <strong>
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : `₹${Number(coupon.discount_value).toFixed(2)}`}
                      </strong>
                      {coupon.maximum_discount !== null && (
                        <div style={{ color: "#64748b", marginTop: "4px" }}>
                          Max ₹{Number(coupon.maximum_discount).toFixed(2)}
                        </div>
                      )}
                      <div style={{ color: "#64748b", marginTop: "4px" }}>
                        Min ₹
                        {Number(coupon.minimum_order_amount).toFixed(2)}
                      </div>
                    </td>

                    <td style={{ padding: "13px 12px" }}>
                      {coupon.customer_type === "new"
                        ? "New"
                        : coupon.customer_type === "vip"
                          ? "VIP"
                          : "Both"}
                      <div style={{ color: "#64748b", marginTop: "4px" }}>
                        {coupon.per_customer_limit} per customer
                      </div>
                    </td>

                    <td style={{ padding: "13px 12px" }}>
                      {coupon.used_count || 0}
                      {" / "}
                      {coupon.usage_limit ?? "Unlimited"}
                    </td>

                    <td style={{ padding: "13px 12px" }}>
                      {formatDate(coupon.expires_at)}
                    </td>

                    <td style={{ padding: "13px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          background: coupon.is_active ? "#dcfce7" : "#fee2e2",
                          color: coupon.is_active ? "#166534" : "#991b1b",
                          fontWeight: 700,
                        }}
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={{ padding: "13px 12px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "7px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => editCoupon(coupon)}
                          style={{
                            ...styles.button,
                            background: "#dbeafe",
                            color: "#1d4ed8",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => toggleCoupon(coupon)}
                          style={{
                            ...styles.button,
                            background: "#fef3c7",
                            color: "#92400e",
                          }}
                        >
                          {coupon.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => deleteCoupon(coupon)}
                          style={{
                            ...styles.button,
                            background: "#fee2e2",
                            color: "#991b1b",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
