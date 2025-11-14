import cn from "../../utils/classnames.ts";

type LoaderSize = "xs" | "sm" | "md" | "lg";

interface LoaderProps {
  className?: string;
  size?: LoaderSize;
}

const sizeClasses: Record<LoaderSize, string> = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-[5px]",
};

export default function Loader({ className = "", size = "md" }: LoaderProps) {
  return (
    <div className={cn(className, "flex items-center justify-center")}>
      <div
        className={cn(
          "animate-spin rounded-full border-chrome-border border-t-chrome-accent-primary",
          sizeClasses[size]
        )}
      />
    </div>
  );
}
