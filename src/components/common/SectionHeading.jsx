const SectionHeading = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="font-display text-2xl text-onyx">{title}</p>
        {subtitle ? <p className="text-sm text-stone">{subtitle}</p> : null}
      </div>
      {action ? <div className="text-sm">{action}</div> : null}
    </div>
  );
};

export default SectionHeading;
