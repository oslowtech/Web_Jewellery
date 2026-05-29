import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "../../utils/format.js";

const CartItem = ({ item, onRemove, onUpdate }) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-3">
      <img
        src={item.image}
        alt={item.name}
        className="h-16 w-16 rounded-xl object-cover"
        loading="lazy"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-xs text-stone">{formatPrice(item.discountPrice || item.price)}</p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-stone/40 p-1"
            onClick={() => onUpdate(item.id, Math.max(1, item.quantity - 1))}
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm">{item.quantity}</span>
          <button
            type="button"
            className="rounded-full border border-stone/40 p-1"
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <button
        type="button"
        className="rounded-full border border-stone/40 p-2 text-rose"
        onClick={() => onRemove(item.id)}
        aria-label="Remove item"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default CartItem;
