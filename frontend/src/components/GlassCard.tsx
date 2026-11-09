import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: "cyan" | "purple" | "emerald" | "amber" | "none";
  tiltFactor?: number;
  elevateOnHover?: boolean;
}

/**
 * Standard utilitarian laboratory panel.
 * Clean, flat, matte, zero animations or 3D tilt.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  className = "",
  glowColor,
  tiltFactor,
  elevateOnHover,
  ...rest
}) => {
  return (
    <div
      className={`panel ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "4px",
        padding: "18px",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};
