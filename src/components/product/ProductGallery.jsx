import { motion } from "framer-motion";

const ProductGallery = ({ images, name }) => {
  return (
    <div className="space-y-3">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {images.map((src, index) => (
          <motion.img
            key={src}
            src={src}
            alt={`${name} ${index + 1}`}
            className="h-72 min-w-[75%] snap-center rounded-3xl object-cover sm:min-w-[60%]"
            loading={index === 0 ? "eager" : "lazy"}
            whileHover={{ scale: 1.02 }}
          />
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {images.map((src) => (
          <img
            key={`${src}-thumb`}
            src={src}
            alt={`${name} thumbnail`}
            className="h-16 w-16 rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
