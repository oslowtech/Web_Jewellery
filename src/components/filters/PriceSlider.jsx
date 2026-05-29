import { formatPrice } from "../../utils/format.js";

const PriceSlider = ({ min, max, value, onChange }) => {
  const [minValue, maxValue] = value;

  const handleMin = (event) => {
    const nextMin = Math.min(Number(event.target.value), maxValue - 100);
    onChange([nextMin, maxValue]);
  };

  const handleMax = (event) => {
    const nextMax = Math.max(Number(event.target.value), minValue + 100);
    onChange([minValue, nextMax]);
  };

  const range = max - min || 1;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-stone">
        <span>{formatPrice(minValue)}</span>
        <span>{formatPrice(maxValue)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-blush/60">
        <div
          className="absolute h-2 rounded-full bg-rose/70"
          style={{
            left: `${((minValue - min) / range) * 100}%`,
            right: `${100 - ((maxValue - min) / range) * 100}%`,
          }}
        />
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={handleMin}
          className="absolute -top-4 h-2 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={handleMax}
          className="h-2 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
};

export default PriceSlider;
