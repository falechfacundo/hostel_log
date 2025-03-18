import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse duration-800 ease-in-out rounded-md bg-transparent/10",
        className
      )}
      {...props}
    />
  );
}
