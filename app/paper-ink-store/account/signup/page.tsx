
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

export default function CustomerSignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loginHref, setLoginHref] = useState(
    "/paper-ink-store/account/login"
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = getSafeNextPath(params.get("next"));

    setLoginHref(
      `/paper-ink-store/account/login?next=${encodeURIComponent(nextPath)}`
    );
  }, []);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const cleanMobile = mobile.replace(/\D/g, "");

    if (fullName.trim().length < 2) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        phone: `+91${cleanMobile}`,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Account could not be created.");
      }

      if (!data.session) {
        setMessage(
          "Account created. Phone verification is not configured yet. Please contact support."
        );
        return;
      }

      const { error: profileError } = await supabase
        .from("store_customers")
        .upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          mobile: cleanMobile,
        });

      if (profileError) throw profileError;

      const params = new URLSearchParams(window.location.search);
      const nextPath = getSafeNextPath(params.get("next"));

      router.push(nextPath);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
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
          Create Customer Account
        </h1>

        <p style={{ color: "#64748b", marginBottom: "25px" }}>
          Sign up to access exclusive store coupons and offers.
        </p>

        <form onSubmit={handleSignup}>
          <label style={{ display: "block", marginBottom: "7px" }}>
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            required
            style={inputStyle}
          />

          <label style={{ display: "block", margin: "15px 0 7px" }}>
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
            placeholder="Minimum 8 characters"
            minLength={8}
            required
            style={inputStyle}
          />

          {message && (
            <p
              style={{
                marginTop: "15px",
                color: "#b91c1c",
                fontSize: "14px",
              }}
            >
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
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: "22px", textAlign: "center" }}>
          Already have an account?{" "}
          <Link
            href={loginHref}
            style={{ color: "#2563eb", fontWeight: "bold" }}
          >
            Login
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
