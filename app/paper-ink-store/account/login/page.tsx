
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

function getSafeNextPath(value: string | null) {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }

  return "/paper-ink-store";
}

export default function CustomerLoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [signupHref, setSignupHref] = useState(
    "/paper-ink-store/account/signup"
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = getSafeNextPath(params.get("next"));

    setSignupHref(
      `/paper-ink-store/account/signup?next=${encodeURIComponent(nextPath)}`
    );
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const cleanMobile = mobile.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: `+91${cleanMobile}`,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Login failed. Please try again.");
      }

      const { error: profileError } = await supabase
        .from("store_customers")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error(
          "Customer profile not found. Please contact support."
        );
      }

      const params = new URLSearchParams(window.location.search);
      const nextPath = getSafeNextPath(params.get("next"));

      router.push(nextPath);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to log in. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: "440px", margin: "45px auto", padding: "20px" }}>
      <div
        style={{
          background: "#ffffff",
          padding: "28px",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ fontSize: "27px", marginBottom: "8px" }}>
          Customer Login
        </h1>

        <p style={{ color: "#64748b", marginBottom: "25px" }}>
          Login to access your account and store coupons.
        </p>

        <form onSubmit={handleLogin}>
          <label style={{ display: "block", marginBottom: "7px" }}>
            Mobile Number
          </label>

          <input
            type="tel"
            inputMode="numeric"
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="10-digit mobile number"
            required
            style={inputStyle}
          />

          <label style={{ display: "block", margin: "15px 0 7px" }}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={inputStyle}
          />

          {message && (
            <p style={{ marginTop: "15px", color: "#b91c1c", fontSize: "14px" }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              marginTop: "22px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "22px", textAlign: "center" }}>
          New customer?{" "}
          <Link
            href={signupHref}
            style={{ color: "#2563eb", fontWeight: "bold" }}
          >
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
};
