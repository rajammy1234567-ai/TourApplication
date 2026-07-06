import React, { useEffect, useState } from "react";
import { Image, type ImageProps } from "expo-image";
import { resolveImageUrl } from "../../constants/exploreTheme";

type SafeImageProps = Omit<ImageProps, "source"> & {
  uri?: string | null;
  fallback: string;
};

export function SafeImage({ uri, fallback, onError, ...props }: SafeImageProps) {
  const [src, setSrc] = useState(() => resolveImageUrl(uri, fallback));

  useEffect(() => {
    setSrc(resolveImageUrl(uri, fallback));
  }, [uri, fallback]);

  return (
    <Image
      {...props}
      source={{ uri: src }}
      onError={(event) => {
        if (src !== fallback) setSrc(fallback);
        onError?.(event);
      }}
    />
  );
}