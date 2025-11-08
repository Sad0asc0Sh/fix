import { cn } from "@/lib/utils";

export const Alert = ({
  children,
  variant = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) => (
  <div
    className={cn(
      "rounded-lg border p-4",
      variant === "destructive" && "border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const AlertTitle = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
    {children}
  </h5>
);

export const AlertDescription = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("text-sm opacity-90", className)} {...props}>
    {children}
  </div>
);