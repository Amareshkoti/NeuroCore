import React, { useRef, useState } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: "cyan" | "purple" | "emerald" | "amber" | "none";
  tiltFactor?: number;
  elevateOnHover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  glowColor = "cyan",
  tiltFactor = 12,
  elevateOnHover = true,
  style,
  className = "",
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const glowStyles = {
    cyan: {
      border: "1px solid rgba(6, 182, 212, 0.25)",
      hoverBorder: "rgba(6, 182, 212, 0.5)",
      shadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(6, 182, 212, 0.12)",
    },
    purple: {
      border: "1px solid rgba(139, 92, 246, 0.25)",
      hoverBorder: "rgba(139, 92, 246, 0.5)",
      shadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(139, 92, 246, 0.12)",
    },
    emerald: {
      border: "1px solid rgba(16, 185, 129, 0.25)",
      hoverBorder: "rgba(16, 185, 129, 0.5)",
      shadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.12)",
    },
    amber: {
      border: "1px solid rgba(245, 158, 11, 0.25)",
      hoverBorder: "rgba(245, 158, 11, 0.5)",
      shadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.12)",
    },
    none: {
      border: "1px solid rgba(255, 255, 255, 0.08)",
      hoverBorder: "rgba(255, 255, 255, 0.2)",
      shadow: "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
    },
  }[glowColor];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -tiltFactor;
    const rotY = ((x - centerX) / centerX) * tiltFactor;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      style={{
        perspective: "1000px",
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`glass-card ${className}`}
        style={{
          background: "linear-gradient(135deg, rgba(16, 23, 41, 0.75) 0%, rgba(9, 13, 24, 0.85) 100%)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderRadius: "14px",
          border: isHovered ? `1px solid ${glowStyles.hoverBorder}` : glowStyles.border,
          boxShadow: isHovered
            ? `${glowStyles.shadow}, 0 10px 30px rgba(0, 0, 0, 0.8)`
            : "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
          transform: isHovered && elevateOnHover
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px) translateY(-3px)`
            : "rotateX(0deg) rotateY(0deg) translateZ(0px) translateY(0px)",
          transition: isHovered ? "transform 0.1s ease-out, border 0.3s ease, box-shadow 0.3s ease" : "transform 0.5s ease-out, border 0.4s ease, box-shadow 0.4s ease",
          transformStyle: "preserve-3d",
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
        {...rest}
      >
        {/* Subtle glass reflection highlight */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        {children}
      </div>
    </div>
  );
};
