"use client";

import Image from "next/image";
import { useState, CSSProperties } from "react";

interface BlurImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: CSSProperties["objectFit"];
  onLoadingComplete?: () => void;
  unoptimized?: boolean;
  sizes?: string;
}

export function BlurImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = "",
  objectFit = "cover",
  onLoadingComplete,
  unoptimized = false,
  sizes,
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {/* Skeleton loader */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-surface-card to-surface-dark animate-pulse" />
      )}

      {/* Image */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        style={{
          objectFit,
        }}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        unoptimized={unoptimized}
        sizes={sizes}
        priority={false}
      />

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-dark to-surface-card flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500 text-xs">Image unavailable</div>
          </div>
        </div>
      )}
    </>
  );
}
