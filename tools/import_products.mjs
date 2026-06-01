#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error("Set them and re-run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/import_products.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const dataPath = path.resolve("src/data/products.json");
if (!fs.existsSync(dataPath)) {
  console.error("src/data/products.json not found. Ensure you run this from project root.");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const normalize = (p) => ({
  id: p.id,
  name: p.name,
  price: Number(p.price),
  discount_price: p.discountPrice ?? null,
  category: p.category ?? null,
  sub_category: p.subCategory ?? null,
  gender: p.gender ?? null,
  description: p.description ?? null,
  material: p.material ?? null,
  stock: Boolean(p.stock),
  featured: Boolean(p.featured),
  is_new: Boolean(p.isNew),
  best_seller: Boolean(p.bestSeller),
  tags: Array.isArray(p.tags) ? p.tags : [],
  image_files: p.imageFiles ?? [],
  image_urls: p.imageUrls ?? [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const items = raw.map(normalize);

const BATCH = 50;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  console.log(`Importing ${items.length} products to Supabase at ${SUPABASE_URL}`);
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    console.log(`Upserting batch ${i + 1}-${i + batch.length} ...`);
    const { data, error } = await supabase.from("products").upsert(batch, { onConflict: "id" }).select("id");
    if (error) {
      console.error("Upsert error:", error.message || error);
      process.exit(1);
    }
    console.log(`Inserted/updated ${data?.length || batch.length} rows.`);
    await sleep(200);
  }
  console.log("Import complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Fatal error during import:", err.message || err);
  process.exit(1);
});
