import { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = "No results found",
  description = "There are no records to display at this time.",
  action,
  className,
}: EmptyStateProps) {
  const iconNode = icon || <SearchX className="w-10 h-10" />;
  
  return (
    <div
      className={cn(
        "empty-state-container relative flex flex-1 flex-col items-center justify-center min-h-[400px] w-full h-full p-8 text-center overflow-hidden",
        "border border-dashed border-border/50 rounded-2xl bg-card/10",
        className
      )}
    >
      {/* Decorative Background Elements to fill the void */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background/0 to-background/0" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      
      {/* Massive Faded Watermark Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] scale-[4] blur-[2px] text-primary">
        {iconNode}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Premium Icon Container */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-3xl bg-background/50 border border-white/10 shadow-[0_0_50px_-12px_rgba(var(--primary),0.3)] backdrop-blur-sm text-primary">
          <div className="absolute inset-0 rounded-3xl bg-primary/10 animate-pulse" />
          {iconNode}
        </div>
        
        <h3 className="text-2xl font-bold tracking-tight mb-3 text-foreground/90">
          {title}
        </h3>
        
        {description && (
          <p className="text-base text-muted-foreground/80 max-w-md mx-auto mb-8 leading-relaxed">
            {description}
          </p>
        )}
        
        {action && (
          <div className="relative z-10 scale-110 hover:scale-105 transition-transform">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
