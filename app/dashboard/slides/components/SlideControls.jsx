'use client';

import React from 'react';
import { Trash2, Image as ImageIcon, MessageSquare, Download, Music } from 'lucide-react';
import ActionButton from './ActionButton';

export default function SlideControls({
  slide,
  slideIndex,
  activeSlideIndex,
  onDeleteSlide,
  onRatioChange,
  onContentModalOpen,
  onAddText,
  onPromptModalOpen,
  onOpenDownloadModal,
  onMusicSelect,
  animationState = 'slide',
  isTextEditing = false
}) {
  const isActive = slideIndex === activeSlideIndex;

  return (
    <>
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: `translateX(-50%) ${animationState === 'text' ? 'translateY(100px)' : 'translateY(0px)'}`,
        display: 'flex',
        gap: '8px',
        opacity: isActive && !isTextEditing ? 1 : 0,
        visibility: isActive && !isTextEditing ? 'visible' : 'hidden',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10
      }}>
        {/* Delete Button */}
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onDeleteSlide(slideIndex);
          }}
          icon={<Trash2 size={16} color="#EF4444" />}
          hoverBgColor="#FEF2F2"
          hoverBorderColor="#FCA5A5"
        />

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

              {/* Music Button */}
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          if (onMusicSelect) {
            onMusicSelect();
          }
        }}
        icon={<Music size={16} color="#3B82F6" />}
        hoverBgColor="#EFF6FF"
        hoverBorderColor="#93C5FD"
      />

        {/* Download Button */}
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onOpenDownloadModal(slideIndex);
          }}
          icon={<Download size={16} color="#10B981" />}
          hoverBgColor="#ECFDF5"
          hoverBorderColor="#6EE7B7"
        />
      </div>
    </>
  );
} 