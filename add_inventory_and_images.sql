-- 1. Add image_urls array and stock_quantity to your products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0;

-- 2. Function to safely reduce stock when an order is placed
CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, quantity_to_deduct integer)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - quantity_to_deduct
  WHERE id = product_id AND stock_quantity >= quantity_to_deduct;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to safely restore stock when an order is cancelled
CREATE OR REPLACE FUNCTION increment_stock(product_id uuid, quantity_to_add integer)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + quantity_to_add
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;