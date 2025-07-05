'use client';

import React from 'react';
import { Trash2, Image as ImageIcon, MessageSquare, PartyPopper } from 'lucide-react';
import ActionButton from './ActionButton';

export default function SlideControls({
  slide,
  slideIndex,
  activeSlideIndex,
  onDeleteSlide,
  onRatioChange,
  onContentModalOpen,
  onGifModalOpen,
  onAddText,
  onPromptModalOpen
}) {
  const isActive = slideIndex === activeSlideIndex;

  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      opacity: isActive ? 1 : 0,
      visibility: isActive ? 'visible' : 'hidden',
      transition: 'opacity 0.3s ease, visibility 0.3s ease',
      zIndex: 10
    }}>
      {/* LFG only supports one slide - no delete button */}

      {/* Ratio Button */}
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onRatioChange(slideIndex);
        }}
        content={slide.ratio}
        fontSize="11px"
        fontWeight="600"
        color="#374151"
      />

      {/* Image Selection Button */}
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onContentModalOpen();
        }}
        icon={<ImageIcon size={16} color="#374151" />}
      />

      {/* Add Text Button */}
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onAddText();
        }}
        content="T"
        fontSize="16px"
        fontWeight="normal"
        color="#374151"
      />

      {/* Prompt Button */}
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onPromptModalOpen();
        }}
        icon={<MessageSquare size={16} color="#374151" />}
        rainbowBorder={true}
      />

      {/* LFG Button */}
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onGifModalOpen();
        }}
        icon={<PartyPopper size={16} color="#374151" />}
      />
    </div>
  );
} 