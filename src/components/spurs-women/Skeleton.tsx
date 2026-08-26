interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** A single pulsing placeholder block; compose shape/color via className. */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`animate-pulse motion-reduce:animate-none ${className}`} style={style} />;
}
