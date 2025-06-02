"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadialProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: "sm" | "md" | "lg" | number
  thickness?: number
  color?: string
  bgColor?: string
}

/**
 * A radial progress component that displays a circular progress indicator with text in the center.
 */
const RadialProgress = React.forwardRef<HTMLDivElement, RadialProgressProps>(
  ({ 
    className, 
    value = 0, 
    size = "md", 
    thickness = 8,
    color,
    bgColor,
    children,
    ...props 
  }, ref) => {
    // Convert size from string to number
    const sizeInPx = React.useMemo(() => {
      if (typeof size === "number") return size
      return size === "sm" ? 80 : size === "md" ? 120 : 160
    }, [size])

    const normalizedValue = Math.min(100, Math.max(0, value))
    
    // Calculate the dimensions for the SVG
    const center = sizeInPx / 2
    const radius = center - thickness / 2
    const circumference = 2 * Math.PI * radius
    
    // Calculate the stroke-dashoffset based on the progress value
    // We're using a semi-circle (180 degrees), so we multiply by 0.5
    const strokeDashoffset = circumference * (1 - (normalizedValue / 100) * 0.5)
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center",
          className
        )}
        style={{ 
          width: sizeInPx, 
          height: sizeInPx 
        }}
        {...props}
      >
        <svg
          width={sizeInPx}
          height={sizeInPx}
          viewBox={`0 0 ${sizeInPx} ${sizeInPx}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="rotate-[-90deg]"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={thickness}
            stroke={bgColor || "var(--background-muted, hsl(0 0% 94%))"}
            className={cn("stroke-muted")}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.5} // Semi-circle
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={thickness}
            stroke={color || "var(--primary, hsl(214.3 31.8% 47.4%))"}
            className={cn("stroke-primary transition-all duration-300 ease-in-out")}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    )
  }
)

RadialProgress.displayName = "RadialProgress"

export { RadialProgress }
