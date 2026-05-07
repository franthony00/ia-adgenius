'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const PLACEHOLDER = '/ads/placeholder.svg';

interface SafeAdImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function SafeAdImage({ src, alt, fill, className, sizes, priority }: SafeAdImageProps) {
  const resolved = src && src.trim() !== '' ? src : PLACEHOLDER;
  const [imgSrc, setImgSrc] = useState(resolved);

  useEffect(() => {
    setImgSrc(src && src.trim() !== '' ? src : PLACEHOLDER);
  }, [src]);

  const isExternal = !imgSrc.startsWith('/');

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={isExternal}
      onError={() => setImgSrc(PLACEHOLDER)}
    />
  );
}
