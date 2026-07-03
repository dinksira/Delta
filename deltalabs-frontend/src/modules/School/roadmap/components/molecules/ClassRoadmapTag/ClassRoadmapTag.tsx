export function ClassRoadmapTag({ label }: Readonly<{ label: string }>) {
  const text = label.startsWith("#") ? label : `#${label}`;
  return (
    <span className="inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
      {text}
    </span>
  );
}
