import { useState } from "react";
import ProductCard from "./ProductCard.jsx";
import QuickViewModal from "./QuickViewModal.jsx";
import SkeletonCard from "../common/SkeletonCard.jsx";

const ProductGrid = ({ products = [], loading }) => {
  const [quickView, setQuickView] = useState(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          : products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickView}
              />
            ))}
      </div>
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </>
  );
};

export default ProductGrid;
