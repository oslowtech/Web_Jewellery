const EmptyState = ({ title, description, action }) => {
  return (
    <div className="rounded-3xl border border-white bg-white/70 p-6 text-center shadow-soft">
      <p className="font-display text-xl text-onyx">{title}</p>
      <p className="mt-2 text-sm text-stone">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};

export default EmptyState;
