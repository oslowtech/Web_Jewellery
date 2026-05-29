const SkeletonCard = () => {
  return (
    <div className="animate-pulse rounded-3xl border border-white bg-white/70 p-3 shadow-soft">
      <div className="h-40 w-full rounded-2xl bg-blush/60" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 rounded-full bg-blush/60" />
        <div className="h-3 w-1/2 rounded-full bg-blush/50" />
        <div className="h-4 w-1/3 rounded-full bg-blush/40" />
      </div>
    </div>
  );
};

export default SkeletonCard;
