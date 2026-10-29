interface ResourceListSkeletonProps {
  label: string;
  items?: number;
}

export default function ResourceListSkeleton({
  label,
  items = 2,
}: ResourceListSkeletonProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="resource-list" aria-hidden="true">
        {Array.from({ length: items }, (_, index) => (
          <article className="resource-card skeleton-card" key={index}>
            <div className="skeleton-line skeleton-label" />
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-description" />
            <div className="skeleton-line skeleton-meta" />
          </article>
        ))}
      </div>
    </div>
  );
}
