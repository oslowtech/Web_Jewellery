import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import useProducts from "../hooks/useProducts.js";
import useRecentProducts from "../hooks/useRecentProducts.js";
import usePageMeta from "../hooks/usePageMeta.js";
import { getIdFromSlug } from "../utils/slug.js";
import ProductGallery from "../components/product/ProductGallery.jsx";
import ProductDetails from "../components/product/ProductDetails.jsx";
import ProductGrid from "../components/product/ProductGrid.jsx";
import SectionHeading from "../components/common/SectionHeading.jsx";
import EmptyState from "../components/common/EmptyState.jsx";

const ProductDetail = () => {
  const { slug } = useParams();
  const { products, loading } = useProducts();
  const productId = getIdFromSlug(slug);

  const product = products.find((item) => item.id === productId);
  const recent = useRecentProducts(product);

  const similar = useMemo(() => {
    if (!product) return [];
    return products
      .filter((item) => item.category === product.category && item.id !== product.id)
      .slice(0, 4);
  }, [products, product]);

  usePageMeta(
    product
      ? {
          title: `${product.name} | Elan Jewellery`,
          description: product.description,
          image: product.images[0],
        }
      : {
          title: "Product | Elan Jewellery",
          description: "Discover premium artificial jewellery with elegant details.",
        }
  );

  if (!product && !loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState
          title="Product not found"
          description="The jewellery piece you are looking for is no longer available."
          action={
            <Link
              to="/shop"
              className="inline-flex rounded-full bg-onyx px-4 py-2 text-sm text-white"
            >
              Continue shopping
            </Link>
          }
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4 rounded-3xl bg-white/70 p-6">
          <div className="h-72 rounded-3xl bg-blush/60" />
          <div className="h-6 w-2/3 rounded-full bg-blush/60" />
          <div className="h-4 w-1/2 rounded-full bg-blush/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductGallery images={product.images} name={product.name} />
        <ProductDetails product={product} />
      </div>
      <section className="space-y-5">
        <SectionHeading title="Similar products" subtitle="You may also love" />
        <ProductGrid products={similar} loading={loading} />
      </section>
      {recent.length > 1 ? (
        <section className="space-y-5">
          <SectionHeading title="Recently viewed" subtitle="Pick up where you left off" />
          <ProductGrid products={recent.filter((item) => item.id !== product.id)} />
        </section>
      ) : null}
    </div>
  );
};

export default ProductDetail;
