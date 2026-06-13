import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Edit } from "lucide-react";
import usePageMeta from "../hooks/usePageMeta.js";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteProduct, fetchProducts, saveProduct } from "../services/productService.js";
import { fetchCustomers } from "../services/userService.js";
import { formatPrice } from "../utils/format.js";
import { removeStorage } from "../utils/storage.js";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { fetchSlides, saveSlide, deleteSlide, fetchCoupons, saveCoupon, deleteCoupon } from "../services/contentService.js";
import { getAllLuckyDrawEntries, verifyAndUseCode, createManualLuckyDrawEntry } from "../services/luckyDrawService.js";

const createEmptyForm = () => ({
  id: "",
  name: "",
  price: "",
  discountPrice: "",
  category: "",
  subCategory: "",
  gender: "women",
  description: "",
  material: "Alloy",
  ringSize: "",
  ringSize2: "",
  imageUrl1: "",
  imageUrl2: "",
  imageUrl3: "",
  imageUrl4: "",
  imageFiles: "",
  tags: "",
  stockQuantity: 0,
  displayOrder: 1,
  stock: true,
  featured: false,
  isNew: false,
  bestSeller: false,
  isCouple: false,
});

const PRODUCTS_CACHE_KEY = "products_cache";

const buildProductId = (name) => {
  const base = (name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6);
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `${base || "JW"}${suffix}`;
};

const Admin = () => {
  const { profile, user, configured, loading: authLoading } = useAuth();
  usePageMeta({
    title: "Admin Portal | Nagneshwari Jewels",
    description: "Manage products from the Supabase admin portal.",
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [pageViews, setPageViews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(createEmptyForm());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [orderEdits, setOrderEdits] = useState({});
  
  const [activeTab, setActiveTab] = useState("products");
  const [slides, setSlides] = useState([]);
  const [slideForm, setSlideForm] = useState({ id: "", image_url: "", link_url: "", display_order: 0 });
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ id: "", code: "", discount_type: "bundle", discount_value: "", min_purchase_amount: 0, required_quantity: 0, valid_product_ids: "", is_active: true });
  
  const [luckyDraws, setLuckyDraws] = useState([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [manualDrawForm, setManualDrawForm] = useState({ name: "", phone: "", amount: "" });
  const [generatedQR, setGeneratedQR] = useState(null);

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))].filter(Boolean);
  }, [products]);

  const sortedProducts = useMemo(
    () => {
      // Map over products and overlay real-time edits if we are currently editing an item
      let filtered = products.map(p => {
        let pOrder = p.displayOrder ?? p.display_order ?? 0;
        if (form.id && p.id === form.id) {
          return {
            ...p,
            name: form.name || p.name,
            displayOrder: Number(form.displayOrder) || 0,
            display_order: Number(form.displayOrder) || 0,
          };
        }
        return { ...p, displayOrder: pOrder, display_order: pOrder };
      });

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.name?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q));
      }
      if (filterCategory) {
        filtered = filtered.filter(p => p.category === filterCategory);
      }
      return filtered.sort((a, b) => {
        const orderA = Number(a.displayOrder ?? a.display_order ?? 0);
        const orderB = Number(b.displayOrder ?? b.display_order ?? 0);
        if (orderA !== orderB) return orderA - orderB;
        return String(a.name).localeCompare(String(b.name));
      });
    },
    [products, searchQuery, filterCategory, form.id, form.name, form.displayOrder]
  );

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProducts({ fallbackToLocal: false });
      setProducts(data || []);
      
      // Automatically set the next available display order for new products
      setForm((prev) => {
        if (!prev.id && (prev.displayOrder === 0 || prev.displayOrder === 1)) {
          const maxOrder = Math.max(0, ...(data || []).map(p => Number(p.displayOrder ?? p.display_order ?? 0)));
          return { ...prev, displayOrder: maxOrder + 1 };
        }
        return prev;
      });
    } catch (loadError) {
      const message = loadError?.message || "Unable to load products.";
      setError(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearProductsCache = () => {
    if (typeof window !== "undefined") {
      removeStorage(PRODUCTS_CACHE_KEY, sessionStorage);
      try { removeStorage(PRODUCTS_CACHE_KEY, localStorage); } catch (e) {} // Ensure it's fully cleared
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (e) {
      // ignore — keep customers empty
      console.error(e?.message || e);
    }
  };

  const loadPageViews = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .order('visited_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        setPageViews(data);
      }
    } catch (e) {
      console.error("Error loading page views:", e);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadPageViews();
    loadSlidesAndCoupons();
    loadLuckyDraws();
  }, []);

  const loadSlidesAndCoupons = async () => {
    try {
      const loadedSlides = await fetchSlides();
      setSlides(loadedSlides || []);
      const loadedCoupons = await fetchCoupons();
      setCoupons(loadedCoupons || []);
    } catch (e) {
      console.error("Failed to load slides or coupons", e);
    }
  };

  const loadLuckyDraws = async () => {
    try {
      const data = await getAllLuckyDrawEntries();
      setLuckyDraws(data || []);
    } catch (e) { console.error("Failed to load lucky draws", e); }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Admin portal state:", {
        authLoading,
        user: user?.email,
        profile: profile?.email,
        configured,
        productsLoading: loading,
        productsCount: products.length,
        error,
      });
    }
  }, [authLoading, user, profile, configured, loading, products.length, error]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const nextId = (form.id || "").trim() || buildProductId(form.name || "");
      const payload = {
        id: nextId,
        name: (form.name || "").trim(),
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        category: (form.category || "").trim(),
        subCategory: (form.subCategory || "").trim(),
        gender: form.gender,
        description: (form.description || "").trim(),
        material: (form.material || "").trim(),
        ringSize: (form.ringSize || "").trim(),
        ringSize2: (form.ringSize2 || "").trim(),
        imageUrls: [
          form.imageUrl1,
          form.imageUrl2,
          form.imageUrl3,
          form.imageUrl4,
        ].map((item) => (item || "").trim()).filter(Boolean),
        imageFiles: (form.imageFiles || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        tags: (form.tags || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        stockQuantity: Number(form.stockQuantity) || 0,
        displayOrder: Number(form.displayOrder) || 0,
        display_order: Number(form.displayOrder) || 0,
        stock: Boolean(form.stock),
        featured: Boolean(form.featured),
        isNew: Boolean(form.isNew),
        bestSeller: Boolean(form.bestSeller),
        isCouple: Boolean(form.isCouple),
      };

      await saveProduct(payload);
      clearProductsCache();
      setSuccess(`Saved ${payload.name} (${payload.id})`);
      setForm((prev) => {
        const maxOrder = Math.max(0, ...products.map(p => Number(p.displayOrder ?? p.display_order ?? 0)), Number(payload.displayOrder));
        return { ...createEmptyForm(), displayOrder: maxOrder + 1 };
      });
      
      // Update local state instantly instead of relying on a potentially cached re-fetch
      setProducts((prev) => {
        if (prev.find(p => p.id === payload.id)) {
          return prev.map(p => p.id === payload.id ? { ...p, ...payload } : p);
        }
        return [...prev, payload];
      });
    } catch (saveError) {
      setError(saveError.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      id: product.id || "",
      name: product.name || "",
      price: product.price || "",
      discountPrice: product.discountPrice || "",
      category: product.category || "",
      subCategory: product.subCategory || "",
      gender: product.gender || "women",
      description: product.description || "",
      material: product.material || "Alloy",
      ringSize: product.ringSize ?? product.ring_size ?? "",
      ringSize2: product.ringSize2 ?? product.ring_size2 ?? "",
      imageUrl1: product.imageUrls?.[0] || product.images?.[0] || "",
      imageUrl2: product.imageUrls?.[1] || product.images?.[1] || "",
      imageUrl3: product.imageUrls?.[2] || product.images?.[2] || "",
      imageUrl4: product.imageUrls?.[3] || product.images?.[3] || "",
      imageFiles: product.imageFiles?.join(", ") || "",
      tags: product.tags?.join(", ") || "",
      stockQuantity: product.stockQuantity ?? product.stock_quantity ?? 0,
      displayOrder: product.displayOrder ?? product.display_order ?? 0,
      stock: product.stock !== false,
      featured: product.featured || false,
      isNew: product.isNew || false,
      bestSeller: product.bestSeller || false,
      isCouple: product.isCouple || false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateOrder = async (product, newOrder) => {
    if (newOrder === undefined || newOrder === "") return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const parsedOrder = Number(newOrder) || 0;
      
      // Ensure payload EXACTLY matches what the main form builds so the backend accepts it
      const payload = {
        id: product.id,
        name: (product.name || "").trim(),
        price: Number(product.price) || 0,
        discountPrice: (product.discountPrice ?? product.discount_price) ? Number(product.discountPrice ?? product.discount_price) : null,
        category: (product.category || "").trim(),
        subCategory: (product.subCategory ?? product.sub_category ?? "").trim(),
        gender: product.gender || "women",
        description: (product.description || "").trim(),
        material: (product.material || "Alloy").trim(),
        ringSize: (product.ringSize ?? product.ring_size ?? "").trim(),
        ringSize2: (product.ringSize2 ?? product.ring_size2 ?? "").trim(),
        imageUrls: [
          product.imageUrls?.[0] || product.images?.[0] || "",
          product.imageUrls?.[1] || product.images?.[1] || "",
          product.imageUrls?.[2] || product.images?.[2] || "",
          product.imageUrls?.[3] || product.images?.[3] || "",
        ].map((item) => (item || "").trim()).filter(Boolean),
        imageFiles: product.imageFiles ?? product.image_files ?? [],
        tags: Array.isArray(product.tags) ? product.tags : (typeof product.tags === 'string' ? product.tags.split(',') : []),
        stockQuantity: Number(product.stockQuantity ?? product.stock_quantity ?? 0),
        displayOrder: parsedOrder,
        display_order: parsedOrder,
        stock: product.stock !== false,
        featured: Boolean(product.featured),
        isNew: Boolean(product.isNew ?? product.is_new),
        bestSeller: Boolean(product.bestSeller ?? product.best_seller),
        isCouple: Boolean(product.isCouple ?? product.is_couple),
      };
      await saveProduct(payload);
      clearProductsCache();
      setSuccess(`Updated order for ${product.name}`);
      setOrderEdits((prev) => { const next = { ...prev }; delete next[product.id]; return next; });
      
      // Immediately apply the new order to the list so it securely animates into place
      setProducts((prev) => prev.map(p => p.id === product.id ? { ...p, ...payload } : p));
    } catch (saveError) {
      setError(saveError.message || "Unable to update order.");
      window.scrollTo({ top: 0, behavior: "smooth" }); // Ensure error is seen
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product from Supabase?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteProduct(id);
      clearProductsCache();
      setSuccess(`Deleted ${id}`);
      // Instantly remove from UI
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete product.");
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...slideForm };
      if (!payload.id) delete payload.id;
      await saveSlide(payload);
      setSuccess("Slide saved!");
      setSlideForm({ id: "", image_url: "", link_url: "", display_order: 0 });
      loadSlidesAndCoupons();
    } catch (err) {
      setError(err.message || "Failed to save slide");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...couponForm, code: couponForm.code.toUpperCase() };
      if (!payload.id) delete payload.id;
      await saveCoupon(payload);
      setSuccess("Coupon saved!");
      setCouponForm({ id: "", code: "", discount_type: "bundle", discount_value: "", min_purchase_amount: 0, required_quantity: 0, valid_product_ids: "", is_active: true });
      loadSlidesAndCoupons();
    } catch (err) {
      setError(err.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (id) => {
    if (window.confirm("Delete slide?")) {
      try {
        await deleteSlide(id);
        loadSlidesAndCoupons();
      } catch (err) { setError(err.message); }
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm("Delete coupon?")) {
      try {
        await deleteCoupon(id);
        loadSlidesAndCoupons();
      } catch (err) { setError(err.message); }
    }
  };

  const handleGenerateOffline = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const entry = await createManualLuckyDrawEntry(manualDrawForm.name, manualDrawForm.phone, Number(manualDrawForm.amount));
      setGeneratedQR(entry);
      setManualDrawForm({ name: "", phone: "", amount: "" });
      loadLuckyDraws();
    } catch (err) {
      setError(err.message || "Failed to generate entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-stone">Admin portal</p>
        <h1 className="font-display text-3xl">Manage products</h1>
        <p className="max-w-2xl text-sm text-stone">
          Signed in as {profile?.full_name || profile?.email || user?.email || "admin"}. Add or remove products from your cloud database.
        </p>
        <Link to="/admin-orders" className="inline-flex rounded-full bg-onyx px-4 py-2 text-sm text-white">
          Manage orders
        </Link>
      </div>

      {!configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Supabase not configured</p>
          <p className="mt-1">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose bg-rose/10 px-4 py-3 text-sm text-rose">
          <p className="font-medium">An error occurred:</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="flex gap-4 border-b border-stone/20 pb-4 overflow-x-auto mb-6">
        {["products", "slides", "coupons", "lucky draw"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(""); setSuccess(""); }}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? "bg-onyx text-white shadow-md" : "bg-stone/10 text-onyx hover:bg-stone/20"
            }`}
          >
            Manage {tab}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
          <div>
            <h2 className="font-display text-xl">{form.id ? "Edit product" : "Add a new product"}</h2>
            <p className="text-sm text-stone">Leave Product ID blank to auto-generate one.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Product ID</span>
              <input name="id" value={form.id} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="JW3001" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Price</span>
              <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Discount price</span>
              <input name="discountPrice" type="number" min="0" value={form.discountPrice} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Category</span>
              <input name="category" value={form.category} onChange={handleChange} required className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Sub-category</span>
              <input name="subCategory" value={form.subCategory} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Gender</span>
              <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2">
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="both">Both (Women & Men)</option>
                <option value="couple">Couple</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Material</span>
              <input name="material" value={form.material} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Ring Size (Optional)</span>
              <input name="ringSize" value={form.ringSize} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="e.g., Adjustable, 12, 14, 16" />
            </label>
            {(form.isCouple || form.gender === "couple") && (
              <label className="space-y-1 text-sm">
                <span>Ring Size 2 (Optional)</span>
                <input name="ringSize2" value={form.ringSize2} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="e.g., Adjustable, 12, 14, 16" />
              </label>
            )}
            <label className="space-y-1 text-sm">
              <span>Stock Quantity</span>
              <input name="stockQuantity" type="number" min="0" value={form.stockQuantity} onChange={handleChange} required className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Display Order</span>
              <input name="displayOrder" type="number" value={form.displayOrder} onChange={handleChange} required className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
          </div>

          <label className="space-y-1 text-sm">
            <span>Description</span>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" className="w-full rounded-2xl border border-white/70 bg-white px-3 py-2" />
          </label>

          <div className="space-y-1 text-sm">
            <span className="block font-medium">Product Images (Google Drive Links)</span>
            {form.imageUrl1 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone">Primary Image Preview</p>
                <img src={form.imageUrl1} alt="Preview" className="h-32 w-32 rounded-xl object-cover shadow-soft border border-white/70" />
              </div>
            )}
            <div className="grid gap-2 md:grid-cols-2">
              <input name="imageUrl1" value={form.imageUrl1} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="Image Link 1 (Primary)" />
              <input name="imageUrl2" value={form.imageUrl2} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="Image Link 2" />
              <input name="imageUrl3" value={form.imageUrl3} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="Image Link 3" />
              <input name="imageUrl4" value={form.imageUrl4} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="Image Link 4" />
            </div>
            <p className="text-xs text-stone mt-1">Links will be automatically converted to direct images.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Image files</span>
              <input name="imageFiles" value={form.imageFiles} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="item1.jpg, item2.jpg" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Tags</span>
              <input name="tags" value={form.tags} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" placeholder="bridal, premium, gift" />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {[
              ["stock", "In stock"],
              ["featured", "Featured"],
              ["isNew", "New arrival"],
              ["bestSeller", "Best seller"],
              ["isCouple", "Couple product"],
            ].map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 rounded-full border border-white/70 bg-white px-3 py-2">
                <input type="checkbox" name={field} checked={form[field]} onChange={handleChange} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="rounded-full bg-onyx px-5 py-3 text-sm text-white transition-colors hover:bg-onyx/90 disabled:opacity-60">
              {saving ? "Saving..." : form.id ? "Update product" : "Publish product"}
            </button>
            {form.id && (
              <button type="button" onClick={() => {
                const maxOrder = Math.max(0, ...products.map(p => Number(p.displayOrder ?? p.display_order ?? 0)));
                setForm({ ...createEmptyForm(), displayOrder: maxOrder + 1 });
              }} className="rounded-full border border-stone/40 px-5 py-3 text-sm text-onyx transition-colors hover:bg-stone/10">
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
          <div>
            <h2 className="font-display text-xl">Live catalog</h2>
            <p className="text-sm text-stone">{loading ? "Loading products..." : `${sortedProducts.length} products loaded`}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center border-b border-stone/10 pb-4">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-xl border border-white/70 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-onyx/30"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-white/70 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-onyx/30"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
            {sortedProducts.map((product) => (
              <div key={product.id} className="rounded-2xl border border-white/70 bg-cream p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {(product.imageUrls?.[0] || product.images?.[0]) ? (
                      <img src={product.imageUrls?.[0] || product.images?.[0]} alt={product.name} className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-soft border border-white/70" />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-xl bg-stone/20" />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-stone">{product.id} · {product.category}{product.subCategory ? ` / ${product.subCategory}` : ""}</p>
                      <p className="mt-1 text-sm text-stone">{formatPrice(product.discountPrice || product.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="mr-2 flex items-center gap-1 rounded-full border border-stone/30 bg-white px-2 py-1 shadow-sm">
                      <span className="text-xs text-stone">Order:</span>
                      <input
                        type="number"
                        className="w-12 bg-transparent text-center text-sm outline-none"
                        value={orderEdits[product.id] !== undefined ? orderEdits[product.id] : (product.displayOrder ?? product.display_order ?? 0)}
                        onChange={(e) => setOrderEdits(prev => ({ ...prev, [product.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateOrder(product, orderEdits[product.id])}
                        disabled={saving || orderEdits[product.id] === undefined}
                        className="px-1 text-xs font-semibold text-rose transition-colors hover:text-rose/80 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                    <button type="button" onClick={() => handleEdit(product)} className="rounded-full border border-stone/30 p-2 text-onyx transition-colors hover:bg-stone/10" aria-label={`Edit ${product.name}`}>
                      <Edit size={16} />
                    </button>
                    <button type="button" onClick={() => handleDelete(product.id)} className="rounded-full border border-stone/30 p-2 text-rose transition-colors hover:bg-rose/10" aria-label={`Delete ${product.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!sortedProducts.length && !loading ? (
              <p className="rounded-2xl border border-dashed border-stone/30 px-4 py-6 text-sm text-stone">
                No products found in Supabase yet.
              </p>
            ) : null}
          </div>
          <div className="mt-6">
            <h3 className="font-display text-lg">Customers</h3>
            <p className="text-sm text-stone">{customers.length} customers</p>
            <div className="mt-3 max-h-56 overflow-y-auto">
              {customers.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/70 bg-cream p-3 mb-2">
                  <p className="font-medium">{c.full_name || c.email}</p>
                  <p className="text-xs text-stone">{c.email} · <span className="font-medium">{c.role}</span></p>
                  {c.address ? <p className="text-sm mt-1">{c.address}</p> : null}
                </div>
              ))}
              {!customers.length ? (
                <p className="text-sm text-stone">No customer profiles found.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 border-t border-white/70 pt-6">
            <h3 className="font-display text-lg">Recent Visitors</h3>
            <p className="text-sm text-stone">Latest {pageViews.length} page views tracked</p>
            <div className="mt-3 max-h-64 overflow-y-auto pr-2 space-y-2">
              {pageViews.map((v) => {
                const isMobile = v.user_agent?.toLowerCase().includes('mobile');
                return (
                  <div key={v.id} className="rounded-2xl border border-white/70 bg-cream p-3">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <p className="font-medium font-mono text-xs break-all text-onyx">{v.path}</p>
                      <span className="text-[10px] text-stone shrink-0">
                        {new Date(v.visited_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone line-clamp-2 leading-relaxed">{v.user_agent}</p>
                    {isMobile ? (
                      <span className="inline-block mt-1.5 text-[10px] bg-rose/10 text-rose px-2 py-0.5 rounded-full font-medium">Mobile</span>
                    ) : (
                      <span className="inline-block mt-1.5 text-[10px] bg-onyx/10 text-onyx px-2 py-0.5 rounded-full font-medium">Desktop</span>
                    )}
                  </div>
                );
              })}
              {!pageViews.length ? (
                <p className="text-sm text-stone">No visitor data found.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === "slides" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSaveSlide} className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
            <h2 className="font-display text-xl">{slideForm.id ? "Edit Slide" : "Add Slide"} (Max 4 recommended)</h2>
            <label className="block space-y-1 text-sm">
              <span>Image URL</span>
              <input required value={slideForm.image_url} onChange={e => setSlideForm({...slideForm, image_url: e.target.value})} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Link URL (e.g. /shop or /product/JW1234)</span>
              <input value={slideForm.link_url} onChange={e => setSlideForm({...slideForm, link_url: e.target.value})} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Display Order</span>
              <input type="number" required value={slideForm.display_order} onChange={e => setSlideForm({...slideForm, display_order: e.target.value})} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-onyx px-5 py-3 text-sm text-white transition-colors hover:bg-onyx/90">Save Slide</button>
              {slideForm.id && <button type="button" onClick={() => setSlideForm({ id: "", image_url: "", link_url: "", display_order: 0 })} className="rounded-full border border-stone/40 px-5 py-3 text-sm transition-colors hover:bg-stone/10">Cancel</button>}
            </div>
          </form>
          
          <div className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
            <h2 className="font-display text-xl">Active Slides</h2>
            <div className="space-y-3">
              {slides.map(slide => (
                <div key={slide.id} className="flex gap-4 rounded-2xl border border-white/70 bg-cream p-3 items-center shadow-sm">
                  <img src={slide.image_url} className="h-16 w-24 object-cover rounded-lg shadow-sm" alt="Slide" />
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{slide.link_url || "No link"}</p>
                    <p className="text-xs text-stone">Order: {slide.display_order}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setSlideForm(slide)} className="text-xs font-semibold text-onyx hover:underline">Edit</button>
                    <button onClick={() => handleDeleteSlide(slide.id)} className="text-xs font-semibold text-rose hover:underline">Delete</button>
                  </div>
                </div>
              ))}
              {slides.length === 0 && <p className="text-sm text-stone italic">No slides found.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "coupons" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSaveCoupon} className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
            <h2 className="font-display text-xl">{couponForm.id ? "Edit Coupon" : "Add Coupon"}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>Coupon Code</span>
                <input required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value})} placeholder="3FOR999" className="w-full rounded-xl border border-white/70 bg-white px-3 py-2 uppercase" />
              </label>
              <label className="space-y-1 text-sm">
                <span>Discount Type</span>
                <select value={couponForm.discount_type} onChange={e => setCouponForm({...couponForm, discount_type: e.target.value})} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2">
                  <option value="bundle">Bundle (e.g. 3 for 999)</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>Discount Value</span>
                <input type="number" required value={couponForm.discount_value} onChange={e => setCouponForm({...couponForm, discount_value: e.target.value})} placeholder="999" className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
              </label>
              <label className="space-y-1 text-sm">
                <span>Required Quantity (for bundles)</span>
                <input type="number" value={couponForm.required_quantity} onChange={e => setCouponForm({...couponForm, required_quantity: e.target.value})} placeholder="3" className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span>Valid Product IDs (Comma separated, empty for all)</span>
              <input value={Array.isArray(couponForm.valid_product_ids) ? couponForm.valid_product_ids.join(', ') : couponForm.valid_product_ids} onChange={e => setCouponForm({...couponForm, valid_product_ids: e.target.value})} placeholder="JW3001, JW3002" className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm({...couponForm, is_active: e.target.checked})} />
              <span>Is Active</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-onyx px-5 py-3 text-sm text-white transition-colors hover:bg-onyx/90">Save Coupon</button>
              {couponForm.id && <button type="button" onClick={() => setCouponForm({ id: "", code: "", discount_type: "bundle", discount_value: "", min_purchase_amount: 0, required_quantity: 0, valid_product_ids: "", is_active: true })} className="rounded-full border border-stone/40 px-5 py-3 text-sm transition-colors hover:bg-stone/10">Cancel</button>}
            </div>
          </form>
          
          <div className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
            <h2 className="font-display text-xl">Active Coupons</h2>
            <div className="space-y-3">
              {coupons.map(coupon => (
                <div key={coupon.id} className="flex justify-between rounded-2xl border border-white/70 bg-cream p-4 shadow-sm">
                  <div>
                    <p className="font-bold text-onyx">{coupon.code}</p>
                    <p className="text-xs font-medium text-stone mt-1">{coupon.discount_type}: {coupon.discount_value}</p>
                    {coupon.valid_product_ids?.length > 0 && <p className="text-[10px] text-stone truncate max-w-[200px] mt-1">Valid on: {coupon.valid_product_ids.join(', ')}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setCouponForm({...coupon, valid_product_ids: coupon.valid_product_ids ? coupon.valid_product_ids.join(', ') : ''})} className="text-xs font-semibold text-onyx hover:underline">Edit</button>
                    <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-xs font-semibold text-rose hover:underline">Delete</button>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && <p className="text-sm text-stone italic">No coupons found.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "lucky draw" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 self-start">
            <div className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
              <h2 className="font-display text-xl">Verify Lucky Draw Code</h2>
              <p className="text-sm text-stone mb-2">Scan a customer's QR or type their code here to verify and redeem it.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="LUCKY-XXXXXX"
                  className="w-full rounded-xl border border-white/70 bg-white px-3 py-2 uppercase"
                />
                <button
                  onClick={async () => {
                    setError(""); setSuccess(""); setSaving(true);
                    try {
                      const updated = await verifyAndUseCode(verifyCode);
                      setSuccess(`Verified & Redeemed! Code ${updated.code} belonging to ${updated.customer_name} is valid.`);
                      setVerifyCode("");
                      loadLuckyDraws();
                    } catch(err) { setError(err.message); } finally { setSaving(false); }
                  }}
                  disabled={saving || !verifyCode}
                  className="rounded-xl bg-onyx px-5 py-2 text-sm text-white disabled:opacity-50"
                >
                  Redeem
                </button>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
              <h2 className="font-display text-xl">Generate Offline Entry</h2>
              <form onSubmit={handleGenerateOffline} className="space-y-3">
                <input type="text" placeholder="Customer Name" required value={manualDrawForm.name} onChange={e => setManualDrawForm({...manualDrawForm, name: e.target.value})} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
                <input type="text" placeholder="Customer Phone" required value={manualDrawForm.phone} onChange={e => setManualDrawForm({...manualDrawForm, phone: e.target.value})} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
                <input type="number" placeholder="Purchase Amount (Min ₹3000)" required min="3000" value={manualDrawForm.amount} onChange={e => setManualDrawForm({...manualDrawForm, amount: e.target.value})} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
                <button type="submit" disabled={saving} className="w-full rounded-xl bg-onyx px-5 py-2 text-sm text-white disabled:opacity-50">Generate QR</button>
              </form>
              {generatedQR && (
                <div className="mt-4 p-4 border border-rose/30 bg-rose/5 rounded-2xl text-center">
                  <p className="font-bold text-lg mb-2">{generatedQR.code}</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${generatedQR.code}`} alt="QR Code" className="w-32 h-32 mx-auto rounded-xl mb-3 p-2 bg-white shadow-sm" crossOrigin="anonymous" />
                  <button onClick={async () => {
                    try {
                      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${generatedQR.code}`);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `LuckyDraw-${generatedQR.code}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch(e) {
                      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${generatedQR.code}`, '_blank');
                    }
                  }} className="text-sm bg-white border border-stone/20 px-4 py-2 rounded-full hover:bg-stone/5 transition-colors">Download QR</button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
             <h2 className="font-display text-xl">Recent Entries</h2>
             <div className="space-y-3 max-h-[600px] overflow-y-auto">
               {luckyDraws.map(draw => (
                 <div key={draw.id} className="rounded-2xl border border-white/70 bg-cream p-4 shadow-sm flex justify-between items-center">
                   <div><p className="font-bold text-onyx">{draw.code}</p><p className="text-sm font-medium">{draw.customer_name} ({draw.customer_phone})</p></div>
                   <div>{draw.is_used ? (<span className="bg-rose/10 text-rose px-2 py-1 rounded text-xs font-bold">Redeemed</span>) : (<span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">Valid</span>)}</div>
                 </div>
               ))}
               {luckyDraws.length === 0 && <p className="text-sm text-stone italic">No lucky draw entries found.</p>}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
