'use client';

import { useRef } from 'react';
import { SLIDE_CONFIG } from '../constants/slideConstants';

export function useSlideCanvas() {
  const slideWidth = SLIDE_CONFIG.SLIDE_WIDTH_PERCENTAGE;
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