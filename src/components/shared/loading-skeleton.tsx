type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className ?? ""}`} />;
}
