"use client";

import { useEffect, useState } from "react";

type PriceHistory = {
  id: number;
  product_id: string | null;
  product_name: string;
  old_price: number;
  new_price: number;
  change_type: "individual" | "bulk";
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  category: "A4 Paper" | "Printer Ink";
  description: string | null;
  brand: string | null;
  gsm: number | null;
  pack_size: string | null;
  compatibility: string | null;
  price: number;
  cost_price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
};

const EMPTY_FORM = {
  name: "",
  category: "A4 Paper" as "A4 Paper" | "Printer Ink",
  description: "",
  brand: "",
  gsm: "",
  pack_size: "",
  compatibility: "",
  price: "",
  cost_price: "",
  stock: "",
  is_active: true,
};

export default function StoreProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkAmount, setBulkAmount] = useState("1");
  const [bulkPriceAmount, setBulkPriceAmount] = useState("10");
  const [bulkPriceMode, setBulkPriceMode] = useState<"increase" | "decrease" | "increasePercent" | "decreasePercent">("increase");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"All" | "In Stock" | "Low Stock" | "Out of Stock">("All");

  useEffect(() => {
    const savedPassword =
      sessionStorage.getItem("storeAdminPassword");

    if (savedPassword) {
      setPassword(savedPassword);
      loadProducts(savedPassword);
    }
  }, []);

  async function loadProducts(adminPassword: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/store-products",
        {
          method: "GET",
          headers: {
            "x-admin-password": adminPassword,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        sessionStorage.removeItem("storeAdminPassword");

        setLoggedIn(false);
        setPassword("");

        throw new Error(
          data.error || "Unable to load products."
        );
      }

      setProducts(data.products || []);
      setLoggedIn(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openPriceHistory(product: Product) {
    setHistoryProduct(product);
    setPriceHistory([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `/api/admin/store-products?priceHistory=${encodeURIComponent(product.id)}`,
        {
          method: "GET",
          headers: { "x-admin-password": password },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load price history.");
      }

      setPriceHistory(data.history || []);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Unable to load price history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function closePriceHistory() {
    setHistoryProduct(null);
    setPriceHistory([]);
    setHistoryError("");
  }

  function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!password.trim()) {
      setError("Please enter the admin password.");
      return;
    }

    sessionStorage.setItem(
      "storeAdminPassword",
      password
    );

    loadProducts(password);
  }

  function handleLogout() {
    sessionStorage.removeItem(
      "storeAdminPassword"
    );

    setLoggedIn(false);
    setPassword("");
    setProducts([]);
    setError("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setEditingProduct(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);

    setForm({
      name: product.name,
      category: product.category,
      description: product.description || "",
      brand: product.brand || "",
      gsm:
        product.gsm !== null
          ? String(product.gsm)
          : "",
      pack_size: product.pack_size || "",
      compatibility:
        product.compatibility || "",
      price: String(product.price),
      cost_price: String(Number(product.cost_price ?? 0)),
      stock: String(product.stock),
      is_active: product.is_active,
    });

    setImageFile(null);
    setImagePreview(product.image_url);

    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Product image must be 5 MB or smaller."
      );
      return;
    }

    setError("");
    setImageFile(file);

    const url = URL.createObjectURL(file);

    setImagePreview(url);
  }

  function updateField(
    field: keyof typeof EMPTY_FORM,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please enter the product name.");
      return;
    }

    if (!form.price.trim()) {
      setError("Please enter the product price.");
      return;
    }

    if (!form.stock.trim()) {
      setError("Please enter the product stock.");
      return;
    }

    const price = Number(form.price);
    const costPrice = Number(form.cost_price);
    const stock = Number(form.stock);

    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!Number.isFinite(costPrice) || costPrice < 0) {
      setError("Please enter a valid purchase cost.");
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      setError(
        "Please enter a valid stock quantity."
      );
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "category",
        form.category
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "brand",
        form.brand.trim()
      );

      formData.append(
        "gsm",
        form.gsm.trim()
      );

      formData.append(
        "pack_size",
        form.pack_size.trim()
      );

      formData.append(
        "compatibility",
        form.compatibility.trim()
      );

      formData.append(
        "price",
        form.price.trim()
      );

      formData.append(
        "cost_price",
        form.cost_price.trim() || "0"
      );

      formData.append(
        "stock",
        form.stock.trim()
      );

      formData.append(
        "is_active",
        String(form.is_active)
      );

      if (imageFile) {
        formData.append(
          "image",
          imageFile
        );
      }

      let response: Response;

      if (editingProduct) {
        formData.append(
          "id",
          editingProduct.id
        );

        response = await fetch(
          "/api/admin/store-products",
          {
            method: "PATCH",
            headers: {
              "x-admin-password":
                password,
            },
            body: formData,
          }
        );
      } else {
        response = await fetch(
          "/api/admin/store-products",
          {
            method: "POST",
            headers: {
              "x-admin-password":
                password,
            },
            body: formData,
          }
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to save product."
        );
      }

      if (editingProduct) {
        setProducts((current) =>
          current.map((product) =>
            product.id === editingProduct.id
              ? data.product
              : product
          )
        );

        setSuccess(
          "Product updated successfully."
        );
      } else {
        setProducts((current) => [
          data.product,
          ...current,
        ]);

        setSuccess(
          "Product added successfully."
        );
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStock(product: Product, amount: number) {
    const nextStock = Number(product.stock) + amount;

    if (nextStock < 0) {
      setError("Stock cannot be less than zero.");
      return;
    }

    try {
      setUpdatingStockId(product.id);
      setError("");
      setSuccess("");

      // The existing admin PATCH endpoint updates products from FormData.
      // Send the current product details with only the stock quantity changed.
      const formData = new FormData();
      formData.append("id", product.id);
      formData.append("name", product.name);
      formData.append("category", product.category);
      formData.append("description", product.description ?? "");
      formData.append("brand", product.brand ?? "");
      formData.append("gsm", product.gsm === null ? "" : String(product.gsm));
      formData.append("pack_size", product.pack_size ?? "");
      formData.append("compatibility", product.compatibility ?? "");
      formData.append("price", String(product.price));
      formData.append("stock", String(nextStock));
      formData.append("is_active", String(product.is_active));

      const response = await fetch("/api/admin/store-products", {
        method: "PATCH",
        headers: { "x-admin-password": password },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.product) {
        throw new Error(data.error || "Unable to update stock.");
      }

      setProducts((current) =>
        current.map((item) => item.id === product.id ? data.product : item)
      );
      setSuccess(`Stock updated for ${product.name}. New stock: ${nextStock}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update stock.");
    } finally {
      setUpdatingStockId(null);
    }
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    const filteredIds = filteredProducts.map((product) => product.id);
    const allSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedProductIds.has(id));

    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (allSelected) filteredIds.forEach((id) => next.delete(id));
      else filteredIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function bulkChangeStock(direction: "add" | "remove") {
    const amount = Number(bulkAmount);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Enter a valid whole-number quantity greater than zero.");
      return;
    }

    const selectedProducts = products.filter((product) =>
      selectedProductIds.has(product.id)
    );

    if (selectedProducts.length === 0) {
      setError("Please select at least one product.");
      return;
    }

    if (
      direction === "remove" &&
      selectedProducts.some((product) => Number(product.stock) < amount)
    ) {
      setError("Cannot remove that quantity: one or more selected products do not have enough stock.");
      return;
    }

    const confirmed = window.confirm(
      `${direction === "add" ? "Add" : "Remove"} ${amount} item(s) ${direction === "add" ? "to" : "from"} ${selectedProducts.length} selected product(s)?`
    );
    if (!confirmed) return;

    setBulkUpdating(true);
    setError("");
    setSuccess("");

    const failedIds = new Set<string>();
    const failedNames: string[] = [];
    let updatedCount = 0;

    try {
      for (const product of selectedProducts) {
        const nextStock = direction === "add"
          ? Number(product.stock) + amount
          : Number(product.stock) - amount;

        try {
          const formData = new FormData();
          formData.append("id", product.id);
          formData.append("name", product.name);
          formData.append("category", product.category);
          formData.append("description", product.description ?? "");
          formData.append("brand", product.brand ?? "");
          formData.append("gsm", product.gsm === null ? "" : String(product.gsm));
          formData.append("pack_size", product.pack_size ?? "");
          formData.append("compatibility", product.compatibility ?? "");
          formData.append("price", String(product.price));
          formData.append("stock", String(nextStock));
          formData.append("is_active", String(product.is_active));
          formData.append("price_update_source", "bulk");

          const response = await fetch("/api/admin/store-products", {
            method: "PATCH",
            headers: { "x-admin-password": password },
            body: formData,
          });
          const data = await response.json();

          if (!response.ok || !data.success || !data.product) {
            throw new Error(data.error || "Stock update failed.");
          }

          setProducts((current) =>
            current.map((item) => item.id === product.id ? data.product : item)
          );
          updatedCount++;
        } catch {
          failedIds.add(product.id);
          failedNames.push(product.name);
        }
      }

      // Keep only failed products selected, so a retry cannot add stock twice
      // to products that were already updated successfully.
      setSelectedProductIds(failedIds);

      if (failedIds.size === 0) {
        setSuccess(`Stock successfully updated for ${updatedCount} product(s).`);
      } else {
        setError(`${updatedCount} product(s) updated. Failed: ${failedNames.join(", ")}. Only failed products remain selected.`);
      }
    } finally {
      setBulkUpdating(false);
    }
  }

  async function bulkChangePrice() {
    const amount = Number(bulkPriceAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid price amount greater than zero.");
      return;
    }

    const selectedProducts = products.filter((product) =>
      selectedProductIds.has(product.id)
    );

    if (selectedProducts.length === 0) {
      setError("Please select at least one product.");
      return;
    }

    const getNextPrice = (price: number) => {
      let nextPrice = price;
      if (bulkPriceMode === "increase") nextPrice = price + amount;
      if (bulkPriceMode === "decrease") nextPrice = price - amount;
      if (bulkPriceMode === "increasePercent") nextPrice = price * (1 + amount / 100);
      if (bulkPriceMode === "decreasePercent") nextPrice = price * (1 - amount / 100);
      return Math.round((nextPrice + Number.EPSILON) * 100) / 100;
    };

    if (bulkPriceMode.includes("Percent") && amount > 100 && bulkPriceMode === "decreasePercent") {
      setError("A price decrease percentage cannot be greater than 100%.");
      return;
    }

    if (selectedProducts.some((product) => getNextPrice(Number(product.price)) < 0)) {
      setError("This price decrease would make one or more product prices negative.");
      return;
    }

    const actionLabels = {
      increase: `increase each price by ₹${amount}`,
      decrease: `decrease each price by ₹${amount}`,
      increasePercent: `increase each price by ${amount}%`,
      decreasePercent: `decrease each price by ${amount}%`,
    };
    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabels[bulkPriceMode]} for ${selectedProducts.length} selected product(s)?`
    );
    if (!confirmed) return;

    setBulkUpdating(true);
    setError("");
    setSuccess("");

    const failedIds = new Set<string>();
    const failedNames: string[] = [];
    let updatedCount = 0;

    try {
      for (const product of selectedProducts) {
        const nextPrice = getNextPrice(Number(product.price));
        try {
          const formData = new FormData();
          formData.append("id", product.id);
          formData.append("name", product.name);
          formData.append("category", product.category);
          formData.append("description", product.description ?? "");
          formData.append("brand", product.brand ?? "");
          formData.append("gsm", product.gsm === null ? "" : String(product.gsm));
          formData.append("pack_size", product.pack_size ?? "");
          formData.append("compatibility", product.compatibility ?? "");
          formData.append("price", String(nextPrice));
          formData.append("stock", String(product.stock));
          formData.append("is_active", String(product.is_active));
          formData.append("price_update_source", "bulk");

          const response = await fetch("/api/admin/store-products", {
            method: "PATCH",
            headers: { "x-admin-password": password },
            body: formData,
          });
          const data = await response.json();
          if (!response.ok || !data.success || !data.product) {
            throw new Error(data.error || "Price update failed.");
          }

          setProducts((current) =>
            current.map((item) => item.id === product.id ? data.product : item)
          );
          updatedCount++;
        } catch {
          failedIds.add(product.id);
          failedNames.push(product.name);
        }
      }

      // Retain only failed products so successful price changes are not repeated.
      setSelectedProductIds(failedIds);
      if (failedIds.size === 0) {
        setSuccess(`Prices successfully updated for ${updatedCount} product(s).`);
      } else {
        setError(`${updatedCount} product(s) updated. Failed: ${failedNames.join(", ")}. Only failed products remain selected.`);
      }
    } finally {
      setBulkUpdating(false);
    }
  }

  async function bulkChangeActive(makeActive: boolean) {
    const selectedProducts = products.filter((product) =>
      selectedProductIds.has(product.id)
    );

    if (selectedProducts.length === 0) {
      setError("Please select at least one product.");
      return;
    }

    const action = makeActive ? "activate" : "deactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedProducts.length} selected product(s)?`
    );
    if (!confirmed) return;

    setBulkUpdating(true);
    setError("");
    setSuccess("");

    const failedIds = new Set<string>();
    const failedNames: string[] = [];
    let updatedCount = 0;

    try {
      for (const product of selectedProducts) {
        try {
          const formData = new FormData();
          formData.append("id", product.id);
          formData.append("name", product.name);
          formData.append("category", product.category);
          formData.append("description", product.description ?? "");
          formData.append("brand", product.brand ?? "");
          formData.append("gsm", product.gsm === null ? "" : String(product.gsm));
          formData.append("pack_size", product.pack_size ?? "");
          formData.append("compatibility", product.compatibility ?? "");
          formData.append("price", String(product.price));
          formData.append("stock", String(product.stock));
          formData.append("is_active", String(makeActive));

          const response = await fetch("/api/admin/store-products", {
            method: "PATCH",
            headers: { "x-admin-password": password },
            body: formData,
          });
          const data = await response.json();

          if (!response.ok || !data.success || !data.product) {
            throw new Error(data.error || "Unable to update product.");
          }

          setProducts((current) =>
            current.map((item) => item.id === product.id ? data.product : item)
          );
          updatedCount++;
        } catch {
          failedIds.add(product.id);
          failedNames.push(product.name);
        }
      }

      // Keep only failed products selected, so successful products are not
      // accidentally changed again if the admin retries the operation.
      setSelectedProductIds(failedIds);

      if (failedIds.size === 0) {
        setSuccess(
          `${updatedCount} product(s) successfully ${makeActive ? "activated" : "deactivated"}.`
        );
      } else {
        setError(
          `${updatedCount} product(s) updated. Failed: ${failedNames.join(", ")}. Only failed products remain selected.`
        );
      }
    } finally {
      setBulkUpdating(false);
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nIf this product has previous orders, it may not be possible to delete it.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/store-products",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": password,
          },
          body: JSON.stringify({
            id: product.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to delete product."
        );
      }

      setProducts((current) =>
        current.filter(
          (item) => item.id !== product.id
        )
      );

      setSuccess(
        "Product deleted successfully."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProducts = products.filter(
    (product) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      const matchesSearch = !search || [
        product.name,
        product.category,
        product.brand,
        product.description,
        product.pack_size,
        product.compatibility,
        product.gsm !== null
          ? String(product.gsm)
          : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);

      const matchesStockFilter =
        stockFilter === "All" ||
        (stockFilter === "In Stock" && product.stock > 5) ||
        (stockFilter === "Low Stock" && product.stock > 0 && product.stock <= 5) ||
        (stockFilter === "Out of Stock" && product.stock <= 0);

      return matchesSearch && matchesStockFilter;
    }
  );

  // INVENTORY SUMMARY
  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.is_active
  ).length;

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 5
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.stock <= 0
  ).length;


  function exportInventoryCSV() {
    if (filteredProducts.length === 0) {
      setError("There are no products to export.");
      return;
    }

    const headers = [
      "Product ID",
      "Product Name",
      "Category",
      "Brand",
      "Description",
      "GSM",
      "Pack Size",
      "Compatibility",
      "Price (INR)",
      "Purchase Cost (INR)",
      "Stock",
      "Stock Status",
      "Active Status",
      "Image URL",
    ];

    const escapeCSV = (value: string | number | boolean | null) => {
      const text = value === null ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredProducts.map((product) => [
      product.id,
      product.name,
      product.category,
      product.brand,
      product.description,
      product.gsm,
      product.pack_size,
      product.compatibility,
      product.price,
      Number(product.cost_price ?? 0),
      product.stock,
      product.stock <= 0
        ? "Out of Stock"
        : product.stock <= 5
        ? "Low Stock"
        : "In Stock",
      product.is_active ? "Active" : "Inactive",
      product.image_url,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    // UTF-8 BOM helps Excel display text correctly.
    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `store-inventory-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setError("");
    setSuccess(`CSV exported successfully (${filteredProducts.length} product(s)).`);
  }

  function getStockStatus(stock: number) {
    if (stock <= 0) {
      return { label: "Out of Stock", className: "stock-out" };
    }

    if (stock <= 5) {
      return { label: "Low Stock", className: "stock-low" };
    }

    return { label: "In Stock", className: "stock-in" };
  }

  /* =========================
     LOGIN PAGE
  ========================= */

  if (!loggedIn) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="login-icon">
            🛍️
          </div>

          <h1>Store Admin</h1>

          <p>
            A4 Paper & Printer Ink
            <br />
            Product Management
          </p>

          <form onSubmit={handleLogin}>
            <label
              htmlFor="admin-password"
              className="password-label"
            >
              Admin Password
            </label>

            <input
              id="admin-password"
              className="password-input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );
                setError("");
              }}
              placeholder="Enter admin password"
              autoComplete="off"
              autoFocus
            />

            <button
              type="button"
              className="show-password"
              onClick={() =>
                setShowPassword(
                  (current) => !current
                )
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
            >
              🔐 Login
            </button>
          </form>
        </div>

        <style jsx>{`
          .login-page {
            min-height: 100vh;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background: #f4f7fb;
            box-sizing: border-box;
          }

          .login-card {
            width: 100%;
            max-width: 420px;
            padding: 35px;
            background: #ffffff;
            border-radius: 18px;
            box-shadow:
              0 10px 35px
              rgba(0, 0, 0, 0.08);
            box-sizing: border-box;
          }

          .login-icon {
            text-align: center;
            font-size: 50px;
            line-height: 1;
            margin-bottom: 14px;
          }

          .login-card h1 {
            margin: 0;
            text-align: center;
            color: #172033;
            font-size: 28px;
            line-height: 1.2;
          }

          .login-card p {
            margin: 10px 0 30px;
            text-align: center;
            color: #667085;
            line-height: 1.5;
            font-size: 14px;
          }

          .password-label {
            display: block !important;
            width: 100% !important;
            margin: 0 0 8px !important;
            color: #344054 !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            text-align: left !important;
          }

          .password-input {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            height: 50px !important;
            min-height: 50px !important;
            margin: 0 !important;
            padding: 0 14px !important;
            box-sizing: border-box !important;
            border: 1px solid #d0d5dd !important;
            border-radius: 10px !important;
            outline: none !important;
            background: #ffffff !important;
            color: #172033 !important;
            font-family: Arial, sans-serif !important;
            font-size: 16px !important;
            line-height: 50px !important;
            appearance: auto !important;
            -webkit-appearance: auto !important;
          }

          .password-input::placeholder {
            color: #98a2b3 !important;
            opacity: 1 !important;
          }

          .password-input:focus {
            border-color: #155eef !important;
            box-shadow:
              0 0 0 3px
              rgba(21, 94, 239, 0.12) !important;
          }

          .show-password {
            display: block !important;
            width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            margin: 10px 0 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 9px !important;
            background: #f2f4f7 !important;
            color: #344054 !important;
            font-family: Arial, sans-serif !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
          }

          .show-password:hover {
            background: #e4e7ec !important;
          }

          .login-button {
            display: block !important;
            width: 100% !important;
            height: 50px !important;
            min-height: 50px !important;
            margin: 15px 0 0 !important;
            padding: 0 14px !important;
            border: none !important;
            border-radius: 10px !important;
            background: #155eef !important;
            color: #ffffff !important;
            font-family: Arial, sans-serif !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            line-height: 50px !important;
            text-align: center !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
          }

          .login-button:hover {
            background: #004eeb !important;
          }

          .login-error {
            display: block !important;
            width: 100% !important;
            margin: 12px 0 0 !important;
            padding: 10px 12px !important;
            border: 1px solid #fecdca !important;
            border-radius: 8px !important;
            background: #fff1f0 !important;
            color: #d92d20 !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
            box-sizing: border-box !important;
          }

          @media (max-width: 500px) {
            .login-page {
              padding: 15px;
            }

            .login-card {
              padding: 25px 20px;
            }
          }
        `}</style>
      </main>
    );
  }

  /* =========================
     ADMIN PRODUCT PAGE
  ========================= */

  return (
    <main className="admin-page">
      <div className="container">
        <header className="header">
          <div>
            <h1>
              🛍️ Store Products
            </h1>

            <p>
              Manage A4 Paper &
              Printer Ink products
            </p>
          </div>

          <div className="header-buttons">
            <button
              className="refresh"
              onClick={() =>
                loadProducts(password)
              }
              disabled={loading}
            >
              🔄 Refresh
            </button>

            <button
              className="export-csv-button"
              onClick={exportInventoryCSV}
              disabled={loading || filteredProducts.length === 0}
              type="button"
            >
              📥 Export CSV
            </button>

            <button
              className="add-button"
              onClick={openAddForm}
            >
              ➕ Add Product
            </button>

            <button
              className="logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="admin-success">
            ✅ {success}
          </div>
        )}

        {/* INVENTORY DASHBOARD */}
        <div className="inventory-dashboard">
          <div className="inventory-card">
            <span>📦 Total Products</span>
            <strong>{totalProducts}</strong>
          </div>

          <div className="inventory-card">
            <span>✅ Active Products</span>
            <strong>{activeProducts}</strong>
          </div>

          <div className="inventory-card low-stock-card">
            <span>⚠️ Low Stock (1–5)</span>
            <strong>{lowStockProducts}</strong>
          </div>

          <div className="inventory-card out-stock-card">
            <span>❌ Out of Stock</span>
            <strong>{outOfStockProducts}</strong>
          </div>
        </div>

        {/* LOW STOCK ALERT NOTIFICATIONS */}
        <section className="stock-alert-panel" aria-label="Inventory stock alerts">
          <div className="stock-alert-header">
            <div>
              <h2>🔔 Inventory Alerts</h2>
              <p>
                {lowStockProducts + outOfStockProducts} product(s) need stock attention.
              </p>
            </div>
            <span className={`stock-alert-total ${outOfStockProducts > 0 ? "has-out-stock" : lowStockProducts > 0 ? "has-low-stock" : "all-stock-ok"}`}>
              {lowStockProducts + outOfStockProducts} Alerts
            </span>
          </div>

          {lowStockProducts === 0 && outOfStockProducts === 0 ? (
            <div className="stock-alert-clear">
              ✅ All products have more than 5 items in stock.
            </div>
          ) : (
            <div className="stock-alert-grid">
              <div className="stock-alert-group out-alert-group">
                <div className="stock-alert-group-heading">
                  <h3>❌ Out of Stock</h3>
                  <strong>{outOfStockProducts}</strong>
                </div>
                {outOfStockProducts === 0 ? (
                  <p className="stock-alert-empty">No products are out of stock.</p>
                ) : (
                  <>
                    <ul className="stock-alert-list">
                      {products
                        .filter((product) => product.stock <= 0)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              className="stock-alert-product"
                              onClick={() => {
                                setSearchTerm(product.name);
                                setStockFilter("All");
                              }}
                            >
                              <span>
                                <strong>{product.name}</strong>
                                <small>{product.category}</small>
                              </span>
                              <b>0 left</b>
                            </button>
                          </li>
                        ))}
                    </ul>
                    <button
                      type="button"
                      className="stock-alert-view-button out-alert-view"
                      onClick={() => {
                        setSearchTerm("");
                        setStockFilter("Out of Stock");
                      }}
                    >
                      View all out-of-stock products
                    </button>
                  </>
                )}
              </div>

              <div className="stock-alert-group low-alert-group">
                <div className="stock-alert-group-heading">
                  <h3>⚠️ Low Stock (1–5)</h3>
                  <strong>{lowStockProducts}</strong>
                </div>
                {lowStockProducts === 0 ? (
                  <p className="stock-alert-empty">No products have low stock.</p>
                ) : (
                  <>
                    <ul className="stock-alert-list">
                      {products
                        .filter((product) => product.stock > 0 && product.stock <= 5)
                        .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
                        .map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              className="stock-alert-product"
                              onClick={() => {
                                setSearchTerm(product.name);
                                setStockFilter("All");
                              }}
                            >
                              <span>
                                <strong>{product.name}</strong>
                                <small>{product.category}</small>
                              </span>
                              <b>{product.stock} left</b>
                            </button>
                          </li>
                        ))}
                    </ul>
                    <button
                      type="button"
                      className="stock-alert-view-button low-alert-view"
                      onClick={() => {
                        setSearchTerm("");
                        setStockFilter("Low Stock");
                      }}
                    >
                      View all low-stock products
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search products, brands, GSM..."
          />

          <span>
            {filteredProducts.length}{" "}
            product
            {filteredProducts.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        <section className="bulk-stock-panel" aria-label="Bulk stock update">
          <div className="bulk-stock-heading">
            <div>
              <h2>📦 Bulk Stock Update</h2>
              <p>{selectedProductIds.size} product(s) selected</p>
            </div>
            <button
              type="button"
              className="select-all-button"
              onClick={toggleSelectAllFiltered}
              disabled={filteredProducts.length === 0 || bulkUpdating}
            >
              {filteredProducts.length > 0 && filteredProducts.every((product) => selectedProductIds.has(product.id))
                ? "Deselect Filtered"
                : "Select All Filtered"}
            </button>
          </div>

          <div className="bulk-stock-actions">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                step="1"
                value={bulkAmount}
                onChange={(event) => setBulkAmount(event.target.value)}
                disabled={bulkUpdating}
              />
            </label>
            <button
              type="button"
              className="bulk-add-button"
              onClick={() => bulkChangeStock("add")}
              disabled={bulkUpdating || selectedProductIds.size === 0}
            >
              {bulkUpdating ? "Updating..." : "＋ Add Stock"}
            </button>
            <button
              type="button"
              className="bulk-remove-button"
              onClick={() => bulkChangeStock("remove")}
              disabled={bulkUpdating || selectedProductIds.size === 0}
            >
              {bulkUpdating ? "Updating..." : "− Remove Stock"}
            </button>
          </div>
        </section>

        <section className="bulk-price-panel" aria-label="Bulk price update">
          <div className="bulk-price-heading">
            <div>
              <h2>💰 Bulk Price Update</h2>
              <p>Change prices for selected A4 Paper and Printer Ink products.</p>
              <strong>{selectedProductIds.size} product(s) selected</strong>
            </div>
          </div>

          <div className="bulk-price-actions">
            <label>
              Price change
              <select
                value={bulkPriceMode}
                onChange={(event) => setBulkPriceMode(event.target.value as typeof bulkPriceMode)}
                disabled={bulkUpdating}
              >
                <option value="increase">Increase by fixed amount (₹)</option>
                <option value="decrease">Decrease by fixed amount (₹)</option>
                <option value="increasePercent">Increase by percentage (%)</option>
                <option value="decreasePercent">Decrease by percentage (%)</option>
              </select>
            </label>
            <label>
              {bulkPriceMode.includes("Percent") ? "Percentage" : "Amount (₹)"}
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={bulkPriceAmount}
                onChange={(event) => setBulkPriceAmount(event.target.value)}
                disabled={bulkUpdating}
              />
            </label>
            <button
              type="button"
              className="bulk-price-update-button"
              onClick={bulkChangePrice}
              disabled={bulkUpdating || selectedProductIds.size === 0}
            >
              {bulkUpdating ? "Updating..." : "💰 Update Selected Prices"}
            </button>
          </div>
          <p className="bulk-price-note">Prices are rounded to 2 decimal places. You will be asked to confirm before changes are saved.</p>
        </section>

        <section className="bulk-active-panel" aria-label="Bulk product visibility">
          <div>
            <h2>⚙️ Bulk Product Visibility</h2>
            <p>Activate or hide selected products in the customer store.</p>
            <strong>{selectedProductIds.size} product(s) selected</strong>
          </div>

          <div className="bulk-active-actions">
            <button
              type="button"
              className="bulk-activate-button"
              onClick={() => bulkChangeActive(true)}
              disabled={bulkUpdating || selectedProductIds.size === 0}
            >
              {bulkUpdating ? "Updating..." : "✅ Activate Selected"}
            </button>
            <button
              type="button"
              className="bulk-deactivate-button"
              onClick={() => bulkChangeActive(false)}
              disabled={bulkUpdating || selectedProductIds.size === 0}
            >
              {bulkUpdating ? "Updating..." : "🚫 Deactivate Selected"}
            </button>
          </div>
        </section>

        <div className="stock-filters" aria-label="Filter products by stock status">
          {(["All", "In Stock", "Low Stock", "Out of Stock"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={stockFilter === filter ? "stock-filter active" : "stock-filter"}
              onClick={() => setStockFilter(filter)}
              aria-pressed={stockFilter === filter}
            >
              {filter}
              <span>
                {filter === "All"
                  ? totalProducts
                  : filter === "In Stock"
                  ? products.filter((product) => product.stock > 5).length
                  : filter === "Low Stock"
                  ? lowStockProducts
                  : outOfStockProducts}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="message">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="message">
            <div className="empty-icon">
              📦
            </div>

            <h2>
              {products.length === 0
                ? "No Products Yet"
                : "No Products Found"}
            </h2>

            <p>
              {products.length === 0
                ? "Click Add Product to add your first A4 Paper or Printer Ink product."
                : "Try a different search term."}
            </p>

            {products.length === 0 && (
              <button
                className="empty-add"
                onClick={openAddForm}
              >
                ➕ Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="products">
            {filteredProducts.map(
              (product) => (
                <article
                  className="product-card"
                  key={product.id}
                >
                  <label className="product-select">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.has(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      disabled={bulkUpdating}
                    />
                    <span>Select for bulk actions</span>
                  </label>
                  <div className="product-image">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                      />
                    ) : (
                      <div className="fallback-image">
                        {product.category ===
                        "A4 Paper"
                          ? "📄"
                          : "🖨️"}
                      </div>
                    )}
                  </div>

                  <div className="product-info">
                    <div className="product-top">
                      <div>
                        <span className="category">
                          {product.category}
                        </span>

                        <h2>
                          {product.name}
                        </h2>

                        {product.brand && (
                          <p className="brand">
                            Brand:{" "}
                            <strong>
                              {product.brand}
                            </strong>
                          </p>
                        )}
                      </div>

                      <span
                        className={
                          product.is_active
                            ? "active"
                            : "inactive"
                        }
                      >
                        {product.is_active
                          ? "Active"
                          : "Hidden"}
                      </span>
                    </div>

                    {product.description && (
                      <p className="description">
                        {product.description}
                      </p>
                    )}

                    <div className="details">
                      {product.gsm !== null && (
                        <span>
                          GSM:{" "}
                          {product.gsm}
                        </span>
                      )}

                      {product.pack_size && (
                        <span>
                          Pack:{" "}
                          {product.pack_size}
                        </span>
                      )}

                      {product.compatibility && (
                        <span>
                          Compatible:{" "}
                          {
                            product.compatibility
                          }
                        </span>
                      )}
                    </div>

                    <div className="stock-status-row">
                      <span className="stock-status-label">Stock Status</span>
                      <span className={`stock-status ${getStockStatus(product.stock).className}`}>
                        {getStockStatus(product.stock).label}
                      </span>
                    </div>

                    <div className="price-stock">
                      <div>
                        <span>
                          Price
                        </span>

                        <strong>
                          ₹
                          {Number(
                            product.price
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Stock
                        </span>

                        <strong>
                          {product.stock}
                        </strong>
                      </div>
                    </div>

                    <div className="quick-stock-controls">
                      <span>Quick stock update</span>
                      <div>
                        <button
                          type="button"
                          className="stock-adjust stock-decrease"
                          onClick={() => changeStock(product, -1)}
                          disabled={updatingStockId === product.id || product.stock <= 0}
                          aria-label={`Decrease ${product.name} stock by one`}
                        >
                          −
                        </button>
                        <strong>{updatingStockId === product.id ? "Saving..." : product.stock}</strong>
                        <button
                          type="button"
                          className="stock-adjust stock-increase"
                          onClick={() => changeStock(product, 1)}
                          disabled={updatingStockId === product.id}
                          aria-label={`Increase ${product.name} stock by one`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="actions">
                      <button
                        type="button"
                        className="history-button"
                        onClick={() => openPriceHistory(product)}
                      >
                        📊 Price History
                      </button>
                      <button
                        className="edit"
                        onClick={() =>
                          openEditForm(
                            product
                          )
                        }
                      >
                        ✏️ Edit / Change Photo
                      </button>

                      <button
                        className="delete"
                        onClick={() =>
                          deleteProduct(
                            product
                          )
                        }
                        disabled={
                          deletingId ===
                          product.id
                        }
                      >
                        {deletingId ===
                        product.id
                          ? "Deleting..."
                          : "🗑️ Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>

      {historyProduct && (
        <div className="modal-overlay" onClick={closePriceHistory}>
          <div className="modal history-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>📊 Price History</h2>
                <p>{historyProduct.name}</p>
                <p className="history-current-price">
                  Current price: ₹{Number(historyProduct.price).toFixed(2)}
                </p>
              </div>
              <button className="close" onClick={closePriceHistory} type="button">×</button>
            </div>

            {historyLoading ? (
              <p className="history-message">Loading price history...</p>
            ) : historyError ? (
              <p className="history-error">{historyError}</p>
            ) : priceHistory.length === 0 ? (
              <p className="history-message">No price changes have been recorded for this product yet.</p>
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>Previous Price</th>
                      <th>New Price</th>
                      <th>Change Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                        <td>₹{Number(item.old_price).toFixed(2)}</td>
                        <td>₹{Number(item.new_price).toFixed(2)}</td>
                        <td>
                          <span className={`history-type ${item.change_type}`}>
                            {item.change_type === "bulk" ? "Bulk Update" : "Individual Edit"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="cancel" onClick={closePriceHistory}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingProduct
                    ? "✏️ Edit Product"
                    : "➕ Add Product"}
                </h2>

                <p>
                  Add product details and
                  upload the real product
                  photo.
                </p>
              </div>

              <button
                className="close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="form-grid">
                <div className="field full">
                  <label>
                    Product Name *
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Example: A4 Paper 70 GSM"
                  />
                </div>

                <div className="field">
                  <label>
                    Category *
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateField(
                        "category",
                        event.target.value
                      )
                    }
                  >
                    <option value="A4 Paper">
                      A4 Paper
                    </option>

                    <option value="Printer Ink">
                      Printer Ink
                    </option>
                  </select>
                </div>

                <div className="field">
                  <label>
                    Brand
                  </label>

                  <input
                    value={form.brand}
                    onChange={(event) =>
                      updateField(
                        "brand",
                        event.target.value
                      )
                    }
                    placeholder="HP, Canon, JK, Epson..."
                  />
                </div>

                <div className="field">
                  <label>
                    Price (₹) *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateField(
                        "price",
                        event.target.value
                      )
                    }
                    placeholder="299"
                  />
                </div>

                <div className="field">
                  <label>
                    Purchase Cost (₹) *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(event) =>
                      updateField(
                        "cost_price",
                        event.target.value
                      )
                    }
                    placeholder="200"
                  />
                  <small>What you pay to purchase one unit or pack.</small>
                </div>

                <div className="field">
                  <label>
                    Stock *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      updateField(
                        "stock",
                        event.target.value
                      )
                    }
                    placeholder="50"
                  />
                </div>

                <div className="field">
                  <label>
                    GSM
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.gsm}
                    onChange={(event) =>
                      updateField(
                        "gsm",
                        event.target.value
                      )
                    }
                    placeholder="70"
                  />
                </div>

                <div className="field">
                  <label>
                    Pack Size
                  </label>

                  <input
                    value={form.pack_size}
                    onChange={(event) =>
                      updateField(
                        "pack_size",
                        event.target.value
                      )
                    }
                    placeholder="500 Sheets"
                  />
                </div>

                <div className="field full">
                  <label>
                    Ink Compatibility
                  </label>

                  <input
                    value={
                      form.compatibility
                    }
                    onChange={(event) =>
                      updateField(
                        "compatibility",
                        event.target.value
                      )
                    }
                    placeholder="HP Ink Tank 115, 315, 415..."
                  />

                  <small>
                    Mainly useful for Printer
                    Ink products.
                  </small>
                </div>

                <div className="field full">
                  <label>
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Write a short product description..."
                    rows={4}
                  />
                </div>

                <div className="field full">
                  <label>
                    Product Photo
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                  />

                  <small>
                    Upload the real product
                    photo. Maximum 5 MB.
                  </small>

                  {imagePreview && (
                    <div className="preview">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                      />
                    </div>
                  )}
                </div>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={
                      form.is_active
                    }
                    onChange={(event) =>
                      updateField(
                        "is_active",
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Show this product in
                    the customer store
                  </span>
                </label>
              </div>

              {error && (
                <div className="form-error">
                  ⚠️ {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "💾 Save Changes"
                    : "➕ Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .inventory-dashboard {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .inventory-card {
          background: #ffffff;
          padding: 20px;
          border-radius: 14px;
          box-shadow: 0 3px 15px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .inventory-card span {
          color: #667085;
          font-size: 14px;
          font-weight: 600;
        }

        .inventory-card strong {
          color: #172033;
          font-size: 30px;
        }

        .low-stock-card {
          border-left: 4px solid #f59e0b;
        }

        .out-stock-card {
          border-left: 4px solid #dc2626;
        }

        .export-csv-button {
          background: #0f766e;
          color: #ffffff;
          border: none;
          padding: 11px 16px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .export-csv-button:hover:not(:disabled) {
          background: #115e59;
        }

        .export-csv-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .stock-alert-panel {
          margin: 0 0 20px;
          padding: 20px;
          border: 1px solid #e4e7ec;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 3px 15px rgba(0, 0, 0, 0.04);
        }

        .stock-alert-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .stock-alert-header h2 {
          margin: 0 0 5px;
          color: #172033;
          font-size: 19px;
        }

        .stock-alert-header p {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .stock-alert-total {
          flex: 0 0 auto;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .stock-alert-total.has-out-stock {
          color: #b42318;
          background: #fef3f2;
        }

        .stock-alert-total.has-low-stock {
          color: #b54708;
          background: #fffaeb;
        }

        .stock-alert-total.all-stock-ok {
          color: #067647;
          background: #ecfdf3;
        }

        .stock-alert-clear {
          padding: 14px;
          border-radius: 10px;
          background: #ecfdf3;
          color: #067647;
          font-size: 14px;
          font-weight: 600;
        }

        .stock-alert-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .stock-alert-group {
          min-width: 0;
          padding: 14px;
          border: 1px solid #eaecf0;
          border-radius: 11px;
        }

        .out-alert-group {
          background: #fffafa;
          border-color: #fecdca;
        }

        .low-alert-group {
          background: #fffdf5;
          border-color: #fedf89;
        }

        .stock-alert-group-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .stock-alert-group-heading h3 {
          margin: 0;
          color: #344054;
          font-size: 15px;
        }

        .stock-alert-group-heading strong {
          min-width: 27px;
          padding: 4px 7px;
          border-radius: 999px;
          background: #ffffff;
          color: #344054;
          text-align: center;
          font-size: 13px;
        }

        .stock-alert-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          max-height: 260px;
          overflow-y: auto;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .stock-alert-product {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 10px;
          border: 1px solid #eaecf0;
          border-radius: 8px;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
        }

        .stock-alert-product:hover {
          border-color: #98a2b3;
          background: #f9fafb;
        }

        .stock-alert-product span {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 3px;
        }

        .stock-alert-product strong {
          overflow-wrap: anywhere;
          color: #172033;
          font-size: 13px;
        }

        .stock-alert-product small {
          color: #667085;
          font-size: 11px;
        }

        .stock-alert-product b {
          flex: 0 0 auto;
          color: #b42318;
          font-size: 12px;
          white-space: nowrap;
        }

        .low-alert-group .stock-alert-product b {
          color: #b54708;
        }

        .stock-alert-view-button {
          width: 100%;
          margin-top: 10px;
          padding: 9px 10px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .out-alert-view {
          background: #fee4e2;
          color: #b42318;
        }

        .low-alert-view {
          background: #fef0c7;
          color: #b54708;
        }

        .stock-alert-empty {
          margin: 12px 0 2px;
          color: #667085;
          font-size: 13px;
        }

        .admin-page {
          min-height: 100vh;
          background: #f4f7fb;
          padding: 30px 18px 60px;
        }

        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          background: #ffffff;
          padding: 24px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          box-shadow:
            0 5px 20px
            rgba(0, 0, 0, 0.05);
        }

        .header h1 {
          margin: 0 0 6px;
          color: #172033;
          font-size: 28px;
        }

        .header p {
          margin: 0;
          color: #667085;
        }

        .header-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .header-buttons button {
          border: none;
          border-radius: 9px;
          padding: 11px 15px;
          cursor: pointer;
          font-weight: 700;
        }

        .refresh {
          background: #eef4ff;
          color: #155eef;
        }

        .add-button {
          background: #155eef;
          color: #ffffff;
        }

        .logout {
          background: #fff1f0;
          color: #d92d20;
        }

        .toolbar {
          background: #ffffff;
          padding: 15px;
          border-radius: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow:
            0 3px 15px
            rgba(0, 0, 0, 0.04);
        }

        .toolbar input {
          flex: 1;
          min-width: 0;
          height: 44px;
          padding: 0 13px;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          outline: none;
          font-size: 15px;
        }

        .toolbar input:focus {
          border-color: #155eef;
        }

        .toolbar span {
          color: #667085;
          font-size: 14px;
          white-space: nowrap;
        }

        .bulk-price-panel {
          background: #ffffff;
          padding: 18px;
          margin-bottom: 18px;
          border-radius: 14px;
          box-shadow: 0 3px 15px rgba(0, 0, 0, 0.04);
          border-left: 4px solid #7f56d9;
        }

        .bulk-price-heading h2 {
          margin: 0 0 6px;
          color: #172033;
          font-size: 18px;
        }

        .bulk-price-heading p {
          margin: 0 0 8px;
          color: #667085;
          font-size: 13px;
        }

        .bulk-price-heading strong {
          color: #344054;
          font-size: 13px;
        }

        .bulk-price-actions {
          display: flex;
          align-items: end;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 15px;
        }

        .bulk-price-actions label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #344054;
          font-size: 13px;
          font-weight: 700;
        }

        .bulk-price-actions input,
        .bulk-price-actions select {
          min-height: 42px;
          min-width: 190px;
          padding: 9px 11px;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          background: #ffffff;
          color: #172033;
          font-size: 14px;
        }

        .bulk-price-update-button {
          min-height: 42px;
          padding: 10px 15px;
          border: none;
          border-radius: 8px;
          background: #6941c6;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .bulk-price-update-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .bulk-price-note {
          margin: 12px 0 0;
          color: #667085;
          font-size: 12px;
        }

        .bulk-active-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          padding: 18px;
          margin-bottom: 20px;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 3px 15px rgba(0, 0, 0, 0.04);
        }

        .bulk-active-panel h2 {
          margin: 0 0 6px;
          color: #172033;
          font-size: 18px;
        }

        .bulk-active-panel p {
          margin: 0 0 8px;
          color: #667085;
          font-size: 13px;
        }

        .bulk-active-panel strong {
          color: #344054;
          font-size: 13px;
        }

        .bulk-active-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .bulk-active-actions button {
          padding: 11px 15px;
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .bulk-activate-button {
          background: #16a34a;
        }

        .bulk-deactivate-button {
          background: #dc2626;
        }

        .bulk-active-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stock-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 0 0 20px;
        }

        .stock-filter {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 13px;
          border: 1px solid #d0d5dd;
          border-radius: 999px;
          background: #ffffff;
          color: #344054;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .stock-filter span {
          min-width: 22px;
          padding: 2px 6px;
          border-radius: 999px;
          background: #f2f4f7;
          text-align: center;
        }

        .stock-filter.active {
          border-color: #155eef;
          background: #eff4ff;
          color: #1849a9;
        }

        .stock-filter.active span {
          background: #dbeafe;
        }

        .admin-error,
        .admin-success {
          margin-bottom: 15px;
          padding: 12px 15px;
          border-radius: 10px;
        }

        .admin-error {
          border: 1px solid #fecdca;
          background: #fff1f0;
          color: #d92d20;
        }

        .admin-success {
          border: 1px solid #abefc6;
          background: #ecfdf3;
          color: #027a48;
        }

        .message {
          background: #ffffff;
          padding: 60px 20px;
          text-align: center;
          border-radius: 16px;
          color: #667085;
        }

        .message h2 {
          color: #172033;
        }

        .empty-icon {
          font-size: 55px;
        }

        .empty-add {
          border: none;
          border-radius: 9px;
          background: #155eef;
          color: #ffffff;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
        }

        .products {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .product-card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 5px 20px
            rgba(0, 0, 0, 0.05);
        }

        .product-image {
          height: 240px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 15px;
          box-sizing: border-box;
        }

        .fallback-image {
          font-size: 75px;
        }

        .product-info {
          padding: 18px;
        }

        .product-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .category {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 999px;
          background: #eef4ff;
          color: #175cd3;
          font-size: 11px;
          font-weight: 700;
        }

        .product-top h2 {
          margin: 9px 0 5px;
          color: #172033;
          font-size: 19px;
        }

        .brand {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .active,
        .inactive {
          height: fit-content;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .active {
          background: #ecfdf3;
          color: #027a48;
        }

        .inactive {
          background: #f2f4f7;
          color: #667085;
        }

        .description {
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        .details {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 12px 0;
        }

        .details span {
          padding: 7px 9px;
          border-radius: 8px;
          background: #f8fafc;
          color: #475467;
          font-size: 12px;
        }

        .bulk-stock-panel {
          background: #ffffff;
          padding: 18px;
          margin-bottom: 18px;
          border-radius: 14px;
          box-shadow: 0 3px 15px rgba(0, 0, 0, 0.04);
        }

        .bulk-stock-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .bulk-stock-heading h2 {
          margin: 0 0 5px;
          color: #172033;
          font-size: 18px;
        }

        .bulk-stock-heading p {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .select-all-button {
          padding: 9px 12px;
          border: 1px solid #155eef;
          border-radius: 8px;
          background: #eef4ff;
          color: #155eef;
          font-weight: 700;
          cursor: pointer;
        }

        .bulk-stock-actions {
          display: flex;
          align-items: end;
          flex-wrap: wrap;
          gap: 10px;
        }

        .bulk-stock-actions label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #344054;
          font-size: 13px;
          font-weight: 700;
        }

        .bulk-stock-actions input {
          width: 100px;
          height: 40px;
          padding: 0 10px;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          font-size: 15px;
        }

        .bulk-stock-actions button {
          min-height: 40px;
          padding: 9px 14px;
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .bulk-add-button { background: #16a34a; }
        .bulk-remove-button { background: #dc2626; }

        .bulk-stock-actions button:disabled,
        .select-all-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .product-select {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          color: #344054;
          font-size: 13px;
          font-weight: 600;
          border-bottom: 1px solid #eaecf0;
          cursor: pointer;
        }

        .product-select input {
          width: 17px;
          height: 17px;
          cursor: pointer;
        }

        .quick-stock-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 14px 0;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #f9fafb;
        }

        .quick-stock-controls > span {
          color: #4b5563;
          font-size: 13px;
          font-weight: 600;
        }

        .quick-stock-controls > div {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quick-stock-controls strong {
          min-width: 24px;
          text-align: center;
          color: #111827;
        }

        .stock-adjust {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 8px;
          color: white;
          font-size: 21px;
          font-weight: 700;
          cursor: pointer;
        }

        .stock-adjust:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .stock-decrease { background: #dc2626; }
        .stock-increase { background: #16a34a; }

        .price-stock {
          display: flex;
          justify-content: space-between;
          padding: 13px 0;
          border-top: 1px solid #eaecf0;
          border-bottom: 1px solid #eaecf0;
        }

        .price-stock div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .price-stock span {
          color: #667085;
          font-size: 12px;
        }

        .price-stock strong {
          color: #172033;
          font-size: 20px;
        }

        .actions {
          display: flex;
          gap: 8px;
          margin-top: 14px;
        }

        .actions button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .history-button {
          background: #ecfdf3;
          color: #027a48;
        }

        .edit {
          background: #eef4ff;
          color: #155eef;
        }

        .delete {
          background: #fff1f0;
          color: #d92d20;
        }

        .history-modal {
          max-width: 900px;
        }

        .history-current-price {
          margin-top: 8px;
          color: #027a48;
          font-weight: 700;
        }

        .history-message,
        .history-error {
          padding: 18px;
          border-radius: 9px;
          background: #f8fafc;
          color: #475467;
        }

        .history-error {
          background: #fff1f0;
          color: #b42318;
        }

        .history-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 620px;
        }

        .history-table th,
        .history-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #eaecf0;
          text-align: left;
          font-size: 14px;
        }

        .history-table th {
          background: #f9fafb;
          color: #475467;
        }

        .history-type {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .history-type.bulk {
          background: #eff8ff;
          color: #175cd3;
        }

        .history-type.individual {
          background: #f4f3ff;
          color: #5925dc;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(16, 24, 40, 0.55);
          padding: 20px;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .modal {
          width: 100%;
          max-width: 760px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 18px;
          padding: 24px;
          box-sizing: border-box;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }

        .modal-header h2 {
          margin: 0 0 5px;
          color: #172033;
        }

        .modal-header p {
          margin: 0;
          color: #667085;
          font-size: 14px;
        }

        .close {
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 9px;
          background: #f2f4f7;
          color: #344054;
          font-size: 25px;
          cursor: pointer;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          color: #344054;
          font-size: 13px;
          font-weight: 700;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          outline: none;
          background: #ffffff;
          color: #172033;
          font-family: inherit;
          font-size: 14px;
          box-sizing: border-box;
        }

        .field textarea {
          resize: vertical;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #155eef;
          box-shadow:
            0 0 0 3px
            rgba(21, 94, 239, 0.1);
        }

        .field small {
          color: #667085;
          font-size: 12px;
        }

        .preview {
          width: 180px;
          height: 180px;
          margin-top: 8px;
          border-radius: 10px;
          overflow: hidden;
          background: #f8fafc;
          border: 1px solid #eaecf0;
        }

        .preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 8px;
          box-sizing: border-box;
        }

        .checkbox-field {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #344054;
          font-size: 14px;
          cursor: pointer;
        }

        .checkbox-field input {
          width: 18px;
          height: 18px;
        }

        .form-error {
          margin-top: 18px;
          padding: 11px 13px;
          border: 1px solid #fecdca;
          border-radius: 9px;
          background: #fff1f0;
          color: #d92d20;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #eaecf0;
        }

        .modal-actions button {
          padding: 11px 17px;
          border: none;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .cancel {
          background: #f2f4f7;
          color: #344054;
        }

        .save {
          background: #155eef;
          color: #ffffff;
        }

        .modal-actions button:disabled,
        .header-buttons button:disabled,
        .actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 850px) {
          .products {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .stock-alert-grid {
            grid-template-columns: 1fr;
          }

          .stock-alert-panel {
            padding: 15px;
          }

          .stock-alert-header {
            align-items: flex-start;
          }
          .bulk-price-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .bulk-price-actions label,
          .bulk-price-actions input,
          .bulk-price-actions select,
          .bulk-price-update-button {
            width: 100%;
          }

          .bulk-active-panel {
            align-items: stretch;
            flex-direction: column;
          }

          .bulk-active-actions {
            flex-direction: column;
          }

          .bulk-active-actions button {
            width: 100%;
          }

          .stock-status-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin: 14px 0 4px;
          }

          .stock-status-label {
            color: #667085;
            font-size: 13px;
            font-weight: 600;
          }

          .stock-status {
            display: inline-flex;
            align-items: center;
            padding: 6px 11px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
          }

          .stock-in {
            color: #067647;
            background: #ecfdf3;
          }

          .stock-low {
            color: #b54708;
            background: #fffaeb;
          }

          .stock-out {
            color: #b42318;
            background: #fef3f2;
          }

          .inventory-dashboard {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-page {
            padding: 15px 10px 40px;
          }

          .header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .header-buttons .add-button {
            grid-column: 1 / -1;
            order: -1;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .stock-filters {
            gap: 8px;
          }

          .stock-filter {
            flex: 1 1 calc(50% - 8px);
            justify-content: center;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .modal {
            padding: 18px;
            margin: 5px auto;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}