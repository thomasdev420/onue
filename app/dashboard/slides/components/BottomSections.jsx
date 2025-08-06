'use client';

import React from 'react';

export default function BottomSections({ 
  slides = [], 
  activeSlideIndex = 0, 
  onSlideSelect, 
  onSlideReorder
}) {

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex !== targetIndex && onSlideReorder) {
      onSlideReorder(sourceIndex, targetIndex);
    }
  };

  return (
    <>


    </>
  );
} 