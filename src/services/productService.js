import productsData from "../data/products.json";
import { buildProductImages } from "../utils/productImages.js";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";
import { extractDriveDirectLink } from "../utils/driveHelpers.js";

const normalizeProduct = (product) => {
  const imageFiles = product.imageFiles || product.image_files || [];
  const rawImageUrls = product.imageUrls || product.image_urls || [];
  
  // Automatically convert any Google Drive links into direct viewable images
  const imageUrls = Array.isArray(rawImageUrls) ? rawImageUrls.map(extractDriveDirectLink) : [];

  return {
    ...product,
    id: product.id,
    price: Number(product.price),
    discountPrice:
      product.discountPrice ?? product.discount_price ?? null,
    category: product.category,
    subCategory: product.subCategory ?? product.sub_category ?? "",
    gender: product.gender,
    description: product.description,
    material: product.material,
    ringSize: product.ringSize ?? product.ring_size ?? "",
    ringSize2: product.ringSize2 ?? product.ring_size2 ?? "",
    stockQuantity: product.stock_quantity ?? product.stockQuantity ?? 0,
    displayOrder: Number(product.display_order ?? product.displayOrder ?? 0),
    stock: Boolean(product.stock),
    featured: Boolean(product.featured),
    isNew: Boolean(product.isNew ?? product.is_new),
    bestSeller: Boolean(product.bestSeller ?? product.best_seller),
    isCouple: Boolean(product.isCouple ?? product.is_couple),
    tags: Array.isArray(product.tags) ? product.tags : [],
    imageFiles,
    imageUrls,
    images: imageUrls.length
      ? imageUrls
      : imageFiles.length
        ? buildProductImages(product.id, imageFiles)
        : product.images ?? [],
  };
};

export const fetchProducts = async ({ fallbackToLocal = true } = {}) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (!fallbackToLocal) {
          throw error;
        }
        console.error("Failed to load products from Supabase", error);
      } else {
        return (data || []).map(normalizeProduct);
      }
    } catch (error) {
      if (!fallbackToLocal) {
        throw error;
      }
      console.error("Failed to load products from Supabase", error);
    }
  }

  if (!fallbackToLocal) {
    return [];
  }

  return productsData.map((product) => ({
    ...normalizeProduct(product),
  }));
};

export const saveProduct = async (product) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  const payload = {
    id: product.id,
    name: product.name,
    price: product.price,
    discount_price: product.discountPrice,
    category: product.category,
    sub_category: product.subCategory,
    gender: product.gender,
    description: product.description,
    material: product.material,
    ring_size: product.ringSize,
    ring_size2: product.ringSize2,
    stock_quantity: product.stockQuantity || 0,
    "displayOrder": product.displayOrder || 0,
    stock: product.stock,
    featured: product.featured,
    is_new: product.isNew,
    best_seller: product.bestSeller,
    is_couple: product.isCouple,
    tags: product.tags,
    image_files: product.imageFiles,
    image_urls: Array.isArray(product.imageUrls) 
      ? product.imageUrls.map(extractDriveDirectLink) 
      : [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeProduct(data);
};

export const deleteProduct = async (productId) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    throw error;
  }
};
