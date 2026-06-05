import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Edit } from "lucide-react";
import usePageMeta from "../hooks/usePageMeta.js";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteProduct, fetchProducts, saveProduct } from "../services/productService.js";
import { fetchCustomers } from "../services/userService.js";
import { formatPrice } from "../utils/format.js";
import { removeStorage } from "../utils/storage.js";

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
  imageUrl1: "",
  imageUrl2: "",
  imageUrl3: "",
  imageUrl4: "",
  imageFiles: "",
  tags: "",
  stockQuantity: 0,
  stock: true,
  featured: false,
  isNew: false,
  bestSeller: false,
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(createEmptyForm());

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [products]
  );

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProducts({ fallbackToLocal: false });
      setProducts(data || []);
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

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

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
        stock: Boolean(form.stock),
        featured: Boolean(form.featured),
        isNew: Boolean(form.isNew),
        bestSeller: Boolean(form.bestSeller),
      };

      await saveProduct(payload);
      clearProductsCache();
      setSuccess(`Saved ${payload.name} (${payload.id})`);
      setForm(createEmptyForm());
      await loadProducts();
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
      imageUrl1: product.imageUrls?.[0] || product.images?.[0] || "",
      imageUrl2: product.imageUrls?.[1] || product.images?.[1] || "",
      imageUrl3: product.imageUrls?.[2] || product.images?.[2] || "",
      imageUrl4: product.imageUrls?.[3] || product.images?.[3] || "",
      imageFiles: product.imageFiles?.join(", ") || "",
      tags: product.tags?.join(", ") || "",
      stockQuantity: product.stockQuantity ?? product.stock_quantity ?? 0,
      stock: product.stock !== false,
      featured: product.featured || false,
      isNew: product.isNew || false,
      bestSeller: product.bestSeller || false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      await loadProducts();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete product.");
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
          <p className="font-medium">Error loading products:</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs text-rose/80">Check that Supabase is configured with valid credentials and the "products" table exists.</p>
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

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
                <option value="unisex">Unisex</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Material</span>
              <input name="material" value={form.material} onChange={handleChange} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span>Stock Quantity</span>
              <input name="stockQuantity" type="number" min="0" value={form.stockQuantity} onChange={handleChange} required className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
            </label>
          </div>

          <label className="space-y-1 text-sm">
            <span>Description</span>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" className="w-full rounded-2xl border border-white/70 bg-white px-3 py-2" />
          </label>

          <div className="space-y-1 text-sm">
            <span className="block font-medium">Product Images (Google Drive Links)</span>
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
              <button type="button" onClick={() => setForm(createEmptyForm())} className="rounded-full border border-stone/40 px-5 py-3 text-sm text-onyx transition-colors hover:bg-stone/10">
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

          <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
            {sortedProducts.map((product) => (
              <div key={product.id} className="rounded-2xl border border-white/70 bg-cream p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-stone">{product.id} · {product.category}{product.subCategory ? ` / ${product.subCategory}` : ""}</p>
                    <p className="mt-1 text-sm text-stone">{formatPrice(product.discountPrice || product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );
};

export default Admin;
