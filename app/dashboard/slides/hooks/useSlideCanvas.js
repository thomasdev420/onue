'use client';

import { useRef } from 'react';

export function useSlideCanvas() {
  const slideWidth = 35;
  const slideItemRefs = useRef([]);
  const imageContainerRefs = useRef([]);
  const canvasRef = useRef(null);

  return {
    slideWidth,
    slideItemRefs,
    imageContainerRefs,
    canvasRef
  };
} 