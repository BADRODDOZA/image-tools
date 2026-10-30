"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Order = {
  id: string; customer_name: string; mobile: string;
  total_amount: number | string; status: string;
  payment_status: string; created_at: string;
};
type Item = {
  id: string; order_id: string; product_id: string | null;
  product_name: string; quantity: number | string;
  price: number | string; total: number | string;
  cost_price: number | string | null; category: string;
};
type ApiResult = { success?: boolean; error?: string; orders?: Order[]; items?: Item[] };
type ProductStat = {
  name: string; category: string; units: number; revenue: number;
  cost: number; profit: number; missingUnits: number;
};

const num = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const money = (v: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(v);

function csvDownload(filename: string, rows: (string | number)[][]) {
  const content = rows.map(row => row.map(v =>
    `"${String(v ?? "").replace(/"/g, '""')}"`
  ).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function StoreProfitDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("profit");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const password = sessionStorage.getItem("storeAdminPassword");
      if (!password) throw new Error("Please log in to Store Admin first.");
      const response = await fetch("/api/admin/store-orders", {
        headers: { "x-admin-password": password }, cache: "no-store",
      });
      const data: ApiResult = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load report.");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setItems(Array.isArray(data.items) ? data.items : []);
      setUpdated(new Date().toLocaleString("en-IN"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load report.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const paidOrders = useMemo(
    () => orders.filter(o => o.payment_status?.toLowerCase() === "paid"), [orders]
  );
  const filteredOrders = useMemo(() => {
    if (period === "all") return paidOrders;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    return paidOrders.filter(o => new Date(o.created_at) >= cutoff);
  }, [paidOrders, period]);
  const orderIds = useMemo(() => new Set(filteredOrders.map(o => o.id)), [filteredOrders]);
  const filteredItems = useMemo(() => items.filter(i => orderIds.has(i.order_id)), [items, orderIds]);

  const stats = useMemo(() => {
    let revenue = 0, cost = 0, profit = 0, missingRevenue = 0;
    let missingUnits = 0, recordedUnits = 0;
    const products = new Map<string, ProductStat>();
    const categories = new Map<string, {
      revenue: number; cost: number; profit: number; units: number; missingUnits: number;
    }>();

    for (const item of filteredItems) {
      const qty = Math.max(0, num(item.quantity));
      const sale = num(item.total) || num(item.price) * qty;
      const unitCost = num(item.cost_price);
      const hasCost = item.cost_price !== null && item.cost_price !== undefined && unitCost > 0;
      const itemCost = hasCost ? unitCost * qty : 0;
      const itemProfit = hasCost ? sale - itemCost : 0;
      const category = item.category || "Other";
      const key = item.product_id || `${item.product_name}-${category}`;
      revenue += sale;
      if (hasCost) { cost += itemCost; profit += itemProfit; recordedUnits += qty; }
      else { missingRevenue += sale; missingUnits += qty; }

      const p = products.get(key) || {
        name: item.product_name || "Unnamed product", category,
        units: 0, revenue: 0, cost: 0, profit: 0, missingUnits: 0,
      };
      p.units += qty; p.revenue += sale;
      if (hasCost) { p.cost += itemCost; p.profit += itemProfit; }
      else p.missingUnits += qty;
      products.set(key, p);

      const c = categories.get(category) || {
        revenue: 0, cost: 0, profit: 0, units: 0, missingUnits: 0,
      };
      c.revenue += sale; c.units += qty;
      if (hasCost) { c.cost += itemCost; c.profit += itemProfit; }
      else c.missingUnits += qty;
      categories.set(category, c);
    }
    return {
      revenue, cost, profit, missingRevenue, missingUnits, recordedUnits,
      products: Array.from(products.values()),
      categories: Array.from(categories.entries()).map(([name, c]) => ({
        name, ...c,
        margin: c.revenue > 0 && c.missingUnits === 0 ? c.profit / c.revenue * 100 : null,
      })),
      margin: revenue > 0 && missingUnits === 0 ? profit / revenue * 100 : null,
    };
  }, [filteredItems]);

  const productRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stats.products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(term))
      .sort((a, b) => sort === "revenue" ? b.revenue - a.revenue
        : sort === "units" ? b.units - a.units
        : sort === "name" ? a.name.localeCompare(b.name)
        : b.profit - a.profit);
  }, [stats.products, search, sort]);

  const daily = useMemo(() => {
    const map = new Map<string, { profit: number; incomplete: boolean }>();
    for (const item of filteredItems) {
      const order = filteredOrders.find(o => o.id === item.order_id);
      if (!order) continue;
      const day = new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const d = map.get(day) || { profit: 0, incomplete: false };
      const qty = Math.max(0, num(item.quantity));
      const sale = num(item.total) || num(item.price) * qty;
      const unitCost = num(item.cost_price);
      if (item.cost_price !== null && item.cost_price !== undefined && unitCost > 0)
        d.profit += sale - unitCost * qty;
      else d.incomplete = true;
      map.set(day, d);
    }
    return Array.from(map.entries()).map(([date, v]) => ({ date, ...v })).slice(-14);
  }, [filteredItems, filteredOrders]);
  const maxDaily = Math.max(1, ...daily.map(d => Math.max(0, d.profit)));

  function exportProducts() {
    csvDownload("store-product-profit-report.csv", [
      ["Product", "Category", "Units Sold", "Revenue INR", "Recorded Cost INR", "Gross Profit INR", "Missing Cost Units"],
      ...productRows.map(p => [p.name, p.category, p.units, p.revenue.toFixed(2),
        p.cost.toFixed(2), p.missingUnits ? "Incomplete" : p.profit.toFixed(2), p.missingUnits]),
    ]);
  }
  function exportOrders() {
    const rows = filteredOrders.map(order => {
      const lines = filteredItems.filter(i => i.order_id === order.id);
      let sale = 0, costSum = 0, profitSum = 0, incomplete = false;
      for (const item of lines) {
        const qty = Math.max(0, num(item.quantity));
        const lineSale = num(item.total) || num(item.price) * qty;
        const unitCost = num(item.cost_price);
        sale += lineSale;
        if (item.cost_price !== null && item.cost_price !== undefined && unitCost > 0) {
          costSum += unitCost * qty; profitSum += lineSale - unitCost * qty;
        } else incomplete = true;
      }
      return [order.id, order.customer_name, order.mobile,
        new Date(order.created_at).toLocaleString("en-IN"), sale.toFixed(2),
        costSum.toFixed(2), incomplete ? "Incomplete" : profitSum.toFixed(2), incomplete ? "No" : "Yes"];
    });
    csvDownload("store-order-profit-report.csv", [
      ["Order ID", "Customer", "Mobile", "Date", "Revenue INR", "Recorded Cost INR", "Gross Profit INR", "Cost Complete"],
      ...rows,
    ]);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">A4 Paper & Printer Ink Store</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Profit & Profit Margin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Profit uses purchase costs saved with each order item. Only paid orders are included.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={load} disabled={loading} className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50">{loading ? "Refreshing..." : "↻ Refresh"}</button>
            <button onClick={exportProducts} disabled={loading || !productRows.length} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Export Products CSV</button>
            <button onClick={exportOrders} disabled={loading || !filteredOrders.length} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Export Orders CSV</button>
          </div>
        </header>

        <section className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
          <div><h2 className="font-semibold">Report Period</h2><p className="text-xs text-slate-500">Based on order creation date</p></div>
          <div className="flex flex-wrap gap-2">
            {[["all", "All Time"], ["30", "Last 30 Days"], ["90", "Last 90 Days"]].map(([v, label]) =>
              <button key={v} onClick={() => setPeriod(v)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${period === v ? "bg-indigo-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>{label}</button>
            )}
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<p className="mt-1 text-xs">Open Store Admin and log in first, then return to this dashboard.</p></div>}

        {loading ? <div className="rounded-xl border bg-white p-10 text-center text-slate-500">Loading profit report...</div> : <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Paid Sales Revenue" value={money(stats.revenue)} note={`${filteredOrders.length} paid order(s)`} />
            <Metric title="Recorded Purchase Cost" value={money(stats.cost)} note={`${stats.recordedUnits} units with cost recorded`} />
            <Metric title="Gross Profit" value={money(stats.profit)} note="Revenue minus recorded product cost" />
            <Metric title="Profit Margin" value={stats.margin === null ? "—" : `${stats.margin.toFixed(2)}%`} note={stats.margin === null ? "Complete positive cost data required" : "Gross profit ÷ revenue"} />
          </section>

          {stats.missingUnits > 0 && <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <h2 className="font-bold text-amber-900">Purchase cost data is incomplete</h2>
            <p className="mt-1 text-sm text-amber-800">{stats.missingUnits} sold unit(s), representing {money(stats.missingRevenue)} in revenue, have no positive purchase cost recorded. These are excluded from gross profit and margin calculations.</p>
            <p className="mt-2 text-xs text-amber-800">Older orders created before cost snapshots may remain incomplete. Enter purchase costs in Store Admin for future orders.</p>
          </section>}

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-lg font-bold">Profit by Category</h2>
              <p className="mb-4 text-xs text-slate-500">A4 Paper, Printer Ink and other categories</p>
              {!stats.categories.length ? <Empty text="No paid order items found for this period." /> :
                <div className="space-y-4">{stats.categories.map(c => <div key={c.name} className="rounded-lg bg-slate-50 p-4">
                  <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{c.name}</h3><span className="text-sm font-bold text-emerald-700">{c.missingUnits ? "Incomplete cost data" : money(c.profit)}</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SmallStat label="Revenue" value={money(c.revenue)} /><SmallStat label="Recorded Cost" value={money(c.cost)} /><SmallStat label="Units" value={String(c.units)} /><SmallStat label="Margin" value={c.margin === null ? "—" : `${c.margin.toFixed(1)}%`} />
                  </div>
                  {c.missingUnits > 0 && <p className="mt-2 text-xs text-amber-700">{c.missingUnits} unit(s) missing cost.</p>}
                </div>)}</div>}
            </section>

            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-lg font-bold">Daily Gross Profit</h2>
              <p className="mb-4 text-xs text-slate-500">Latest 14 sales dates in this period</p>
              {!daily.length ? <Empty text="No paid sales found for this period." /> :
                <div className="space-y-3">{daily.map(d => <div key={d.date}>
                  <div className="mb-1 flex justify-between gap-3 text-xs"><span className="font-medium text-slate-600">{d.date}</span><span className="font-semibold">{d.incomplete ? "Incomplete" : money(d.profit)}</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, d.profit) / maxDaily * 100}%` }} /></div>
                </div>)}</div>}
            </section>
          </div>

          <section className="rounded-xl border bg-white p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><h2 className="text-lg font-bold">Product Profit Report</h2><p className="text-xs text-slate-500">Search and sort products by paid sales performance.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or category..." className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="profit">Highest Profit</option><option value="revenue">Highest Revenue</option><option value="units">Most Units Sold</option><option value="name">Name A–Z</option>
                </select>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr>
                <th className="px-3 py-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3 text-right">Units</th><th className="px-3 py-3 text-right">Revenue</th><th className="px-3 py-3 text-right">Recorded Cost</th><th className="px-3 py-3 text-right">Gross Profit</th><th className="px-3 py-3 text-right">Cost Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {productRows.map(p => <tr key={`${p.name}-${p.category}`} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-semibold">{p.name}</td><td className="px-3 py-3">{p.category}</td><td className="px-3 py-3 text-right">{p.units}</td><td className="px-3 py-3 text-right">{money(p.revenue)}</td><td className="px-3 py-3 text-right">{money(p.cost)}</td><td className="px-3 py-3 text-right font-bold text-emerald-700">{p.missingUnits ? "—" : money(p.profit)}</td>
                  <td className="px-3 py-3 text-right">{p.missingUnits ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{p.missingUnits} missing</span> : <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Recorded</span>}</td>
                </tr>)}
                {!productRows.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No matching products found.</td></tr>}
              </tbody>
            </table></div>
          </section>

          <section className="rounded-xl border bg-white p-5">
            <h2 className="text-lg font-bold">Profit Calculation Notes</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Only orders with payment status <strong>Paid</strong> are included.</li>
              <li>Gross profit = item sales revenue − recorded purchase cost.</li>
              <li>Profit margin = gross profit ÷ revenue × 100. It is shown only when every included sold unit has a positive recorded purchase cost.</li>
              <li>Older orders without a saved cost snapshot, and items with zero purchase cost, are marked incomplete rather than guessed.</li>
              <li>This is gross product profit. Delivery charges, payment gateway fees, taxes, returns and operating expenses are not deducted.</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">Last updated: {updated || "—"}</p>
          </section>
        </>}
      </div>
    </main>
  );
}

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p>
  </div>;
}
function SmallStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">{text}</div>;
}
