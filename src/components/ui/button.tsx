import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary: "border-2 border-border bg-primary text-primary-foreground shadow-pop-sm hover:-translate-y-px hover:shadow-pop active:translate-y-px active:shadow-none",
  secondary: "border-2 border-border bg-secondary text-secondary-foreground shadow-pop-sm hover:-translate-y-px hover:shadow-pop active:translate-y-px active:shadow-none",
  outline: "border-2 border-border bg-card text-foreground shadow-pop-sm hover:-translate-y-px hover:shadow-pop active:translate-y-px active:shadow-none",
  ghost: "border-2 border-transparent text-foreground hover:bg-muted",
  danger: "border-2 border-border bg-danger text-white shadow-pop-sm hover:-translate-y-px hover:shadow-pop active:translate-y-px active:shadow-none",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9 p-0 justify-center",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center rounded-[2px] font-bold uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
export { variantClasses as buttonVariants };
