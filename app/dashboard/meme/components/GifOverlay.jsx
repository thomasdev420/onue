'use client';

import React from 'react';
import Image from 'next/image';

export default function GifOverlay({
  gifOverlay,
  gifIndex,
  slideIndex,
  activeSlideIndex,
  isBeingDragged,
  draggingInfo,
  onMouseDown,
  onDelete
}) {
  const isActive = slideIndex === activeSlideIndex;
  const isDragging = isBeingDragged && draggingInfo.isDragging;

  return (
    <>
      <Image
        src={gifOverlay.src}
        alt={gifOverlay.alt}
        width={gifOverlay.size}
        height={gifOverlay.size}
        style={{
          position: 'absolute',
          left: gifOverlay.position.x,
          top: gifOverlay.position.y,
          width: gifOverlay.size,
          height: gifOverlay.size,
          cursor: isActive ? 'move' : 'default',
          zIndex: isDragging ? 1000 : 100,
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          opacity: isActive ? 1 : 0.7,
          pointerEvents: isActive ? 'auto' : 'none',
          borderRadius: '8px',
          objectFit: 'cover'
        }}
        onMouseDown={(e) => {
          if (isActive) {
            onMouseDown(e, gifIndex);
          }
        }}
      />
      {isActive && (
        <button
          style={{
            position: 'absolute',
            left: gifOverlay.position.x + gifOverlay.size - 18,
            top: gifOverlay.position.y - 8,
            width: 20,
            height: 20,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 1100
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(gifIndex);
          }}
        >
          ×
        </button>
      )}
    </>
  );
} 