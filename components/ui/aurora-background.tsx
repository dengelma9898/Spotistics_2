"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 transition-bg",
        className
      )}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 opacity-50 mix-blend-color-dodge",
            "bg-[radial-gradient(ellipse_at_center,rgba(0,204,177,0.6),transparent_50%),radial-gradient(ellipse_at_top_left,rgba(123,97,255,0.5),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(255,196,20,0.6),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(28,160,251,0.5),transparent_50%)]"
          )}
        />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          style={{
            backgroundImage:
              "radial-gradient(circle farthest-side at 0 100%, #00ccb1, transparent), radial-gradient(circle farthest-side at 100% 0, #7b61ff, transparent), radial-gradient(circle farthest-side at 100% 100%, #ffc414, transparent), radial-gradient(circle farthest-side at 0 0, #1ca0fb, #141316)",
            backgroundSize: "400% 400%",
          }}
        />
      </div>
      {showRadialGradient && (
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}; 