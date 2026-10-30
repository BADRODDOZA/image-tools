"use client";

import { useEffect, useMemo, useState } from "react";

type PriceHistory = {
  id: number;
  product_id: string | null;
  product_name: string;
  old_price: number;
  new_price: number;
  change_type: "individual" | "bulk";
  created_at: string;
};

export default function StorePriceHistoryDashboard() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const saved = sessionStorage.getItem("storeAdminPassword");
    if (saved) {
      setPassword(saved);
      loadHistory(saved);
    }
    // Load the saved admin session once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHistory(adminPassword: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/store-products?priceHistory=all", {
        method: "GET",
        headers: { "x-admin-password": adminPassword },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("storeAdminPassword");
          setLoggedIn(false);
        }
        throw new Error(data.error || "Unable to load price history.");
      }
      setHistory(data.history || []);
      setLoggedIn(true);
      sessionStorage.setItem("storeAdminPassword", adminPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load price history.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) {
      setError("Please enter the admin password.");
      return;
    }
    await loadHistory(password.trim());
  }

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...history]
      .filter((item) => !term || item.product_name.toLowerCase().includes(term))
      .filter((item) => typeFilter === "All" || item.change_type === typeFilter.toLowerCase())
      .sort((a, b) => sortOrder === "oldest"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [history, search, typeFilter, sortOrder]);

  function exportCSV() {
    const rows = [
      ["Product", "Old Price", "New Price", "Change", "Date & Time", "Product ID"],
      ...filteredHistory.map((item) => [
        item.product_name,
        Number(item.old_price).toFixed(2),
        Number(item.new_price).toFixed(2),
        item.change_type,
        new Date(item.created_at).toLocaleString("en-IN"),
        item.product_id || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "store-product-price-history.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const totalChanges = history.length;
  const bulkChanges = history.filter((item) => item.change_type === "bulk").length;
  const individualChanges = totalChanges - bulkChanges;

  return (
    <main className="page">
      <div className="topbar">
        <div>
          <p className="eyebrow">A4 PAPER & PRINTER INK</p>
          <h1>📊 Product Price History</h1>
          <p className="subtitle">Review every recorded product price change.</p>
        </div>
        <a className="back" href="/admin/store-products">← Back to Store Products</a>
      </div>

      {!loggedIn ? (
        <section className="login card">
          <h2>🔐 Store Admin Login</h2>
          <p>Enter the same admin password used for Store Products.</p>
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" autoComplete="current-password" />
            <button type="submit" disabled={loading}>{loading ? "Loading..." : "Login and View History"}</button>
          </form>
          {error && <p className="error">{error}</p>}
        </section>
      ) : (
        <>
          <section className="stats">
            <div className="stat card"><span>Total price changes</span><strong>{totalChanges}</strong></div>
            <div className="stat card"><span>Individual updates</span><strong>{individualChanges}</strong></div>
            <div className="stat card"><span>Bulk updates</span><strong>{bulkChanges}</strong></div>
          </section>

          <section className="card controls">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product name..." aria-label="Search product name" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter update type">
              <option>All</option><option value="individual">Individual</option><option value="bulk">Bulk</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Sort history">
              <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
            </select>
            <button type="button" className="export" onClick={exportCSV} disabled={!filteredHistory.length}>⬇ Export CSV</button>
            <button type="button" className="refresh" onClick={() => loadHistory(password)} disabled={loading}>{loading ? "Refreshing..." : "↻ Refresh"}</button>
          </section>

          {error && <p className="error">{error}</p>}
          <section className="card table-card">
            <div className="table-heading"><h2>Price Change Records</h2><span>{filteredHistory.length} records</span></div>
            {loading ? <p className="empty">Loading price history...</p> : filteredHistory.length === 0 ? <p className="empty">No price history records match your search.</p> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Product</th><th>Previous Price</th><th>New Price</th><th>Difference</th><th>Update Type</th><th>Date & Time</th></tr></thead>
                <tbody>{filteredHistory.map((item) => {
                  const difference = Number(item.new_price) - Number(item.old_price);
                  return <tr key={item.id}>
                    <td><strong>{item.product_name}</strong></td>
                    <td>₹{Number(item.old_price).toFixed(2)}</td>
                    <td>₹{Number(item.new_price).toFixed(2)}</td>
                    <td className={difference > 0 ? "up" : difference < 0 ? "down" : "same"}>{difference > 0 ? "+" : ""}₹{difference.toFixed(2)}</td>
                    <td><span className={`pill ${item.change_type}`}>{item.change_type === "bulk" ? "Bulk" : "Individual"}</span></td>
                    <td>{new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  </tr>;
                })}</tbody>
              </table></div>
            )}
          </section>
        </>
      )}

      <style jsx>{`
        * { box-sizing: border-box; }
        .page { max-width: 1250px; margin: 0 auto; padding: 28px 18px 60px; color: #172033; }
        .topbar { display:flex; justify-content:space-between; align-items:center; gap:18px; margin-bottom:24px; flex-wrap:wrap; }
        .eyebrow { margin:0 0 7px; color:#64748b; font-size:12px; font-weight:800; letter-spacing:1.2px; }
        h1 { margin:0; font-size:clamp(25px,4vw,34px); }
        .subtitle { margin:8px 0 0; color:#64748b; }
        .back { color:#2563eb; text-decoration:none; font-weight:700; }
        .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 4px 18px rgba(15,23,42,.04); }
        .stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
        .stat { padding:19px; display:flex; flex-direction:column; gap:8px; }
        .stat span { color:#64748b; font-size:14px; }
        .stat strong { font-size:28px; }
        .controls { padding:14px; display:flex; gap:10px; flex-wrap:wrap; margin-bottom:18px; }
        input, select { min-height:42px; border:1px solid #cbd5e1; border-radius:8px; padding:9px 12px; background:#fff; color:#172033; font:inherit; }
        .controls input { flex:1; min-width:200px; }
        button { border:0; border-radius:8px; padding:10px 15px; background:#2563eb; color:#fff; font-weight:700; cursor:pointer; }
        button:disabled { opacity:.55; cursor:not-allowed; }
        .export { background:#15803d; }.refresh { background:#475569; }
        .table-card { overflow:hidden; }
        .table-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:17px 18px; border-bottom:1px solid #e2e8f0; }
        .table-heading h2 { margin:0; font-size:18px; }.table-heading span { color:#64748b; font-size:13px; }
        .table-wrap { overflow-x:auto; }
        table { width:100%; border-collapse:collapse; min-width:850px; }
        th, td { text-align:left; padding:14px 16px; border-bottom:1px solid #edf2f7; white-space:nowrap; font-size:14px; }
        th { background:#f8fafc; color:#475569; font-size:12px; text-transform:uppercase; letter-spacing:.4px; }
        tbody tr:last-child td { border-bottom:0; }
        .up { color:#15803d; font-weight:700; }.down { color:#dc2626; font-weight:700; }.same { color:#64748b; }
        .pill { display:inline-block; padding:5px 9px; border-radius:20px; font-size:12px; font-weight:700; }
        .pill.bulk { background:#ede9fe; color:#6d28d9; }.pill.individual { background:#dbeafe; color:#1d4ed8; }
        .empty { padding:28px 18px; text-align:center; color:#64748b; }
        .login { max-width:460px; margin:45px auto; padding:25px; }.login h2 { margin-top:0; }.login p { color:#64748b; }
        .login form { display:flex; flex-direction:column; gap:12px; }.login input { width:100%; }
        .error { color:#b91c1c; background:#fef2f2; padding:11px 13px; border-radius:8px; }
        @media(max-width:650px) { .stats { grid-template-columns:1fr; }.topbar { align-items:flex-start; }.controls > * { width:100%; }.stat { padding:15px; } }
      `}</style>
    </main>
  );
}
