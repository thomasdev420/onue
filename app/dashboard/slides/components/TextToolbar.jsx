'use client';

import React from 'react';
import FontSelector from './FontSelector';
import ColorSelector from './ColorSelector';
import { Italic, Type } from 'lucide-react';

export default function TextToolbar({
  isVisible,
  textItem,
  slideIndex,
  textIndex,
  onFontChange,
  onColorChange,
  onItalicToggle,
  onFontSizeIncrease,
  onFontSizeDecrease,
  onCaptionToggle,
  onCaptionBackgroundToggle
}) {
  if (!isVisible) return null;

  return (
    <div 
      data-font-size-controls
      style={{
        position: 'absolute',
        bottom: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 1001,
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: '50px',
        padding: '8px 16px',
        boxShadow: 'none',
        border: '1px solid #E5E7EB',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      {/* Font Selector */}
      <FontSelector
        selectedFont={textItem?.style?.fontFamily}
        onFontChange={(font) => onFontChange && onFontChange(slideIndex, textIndex, font.family)}
      />
      {/* Color Selector */}
      <ColorSelector
        selectedColor={textItem?.style?.color}
        onColorChange={(color) => onColorChange && onColorChange(slideIndex, textIndex, color.hex)}
      />
      {/* Italic Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onItalicToggle && onItalicToggle(slideIndex, textIndex);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onFocus={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: textItem?.style?.fontStyle === 'italic' ? '#3B82F6' : 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #E5E5E5',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '14px',
          color: textItem?.style?.fontStyle === 'italic' ? 'white' : '#374151',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (textItem?.style?.fontStyle !== 'italic') {
            e.currentTarget.style.backgroundColor = '#F0F9FF';
            e.currentTarget.style.borderColor = '#93C5FD';
          }
        }}
        onMouseLeave={(e) => {
          if (textItem?.style?.fontStyle !== 'italic') {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.borderColor = '#E5E5E5';
          }
        }}
      >
                     <Italic size={16} />
           </button>
           
           {/* Caption Toggle */}
           <button
             onClick={(e) => {
               e.stopPropagation();
               e.preventDefault();
               onCaptionToggle && onCaptionToggle(slideIndex, textIndex);
             }}
             onMouseDown={(e) => {
               e.stopPropagation();
               e.preventDefault();
             }}
             onFocus={(e) => {
               e.stopPropagation();
             }}
             style={{
               width: '32px',
               height: '32px',
               borderRadius: '50%',
               backgroundColor: textItem?.style?.caption ? '#3B82F6' : 'rgba(255, 255, 255, 0.9)',
               border: '1px solid #E5E5E5',
               cursor: 'pointer',
               display: 'flex',
               justifyContent: 'center',
               alignItems: 'center',
               fontSize: '14px',
               color: textItem?.style?.caption ? 'white' : '#374151',
               boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
               transition: 'all 0.2s ease'
             }}
             onMouseEnter={(e) => {
               if (!textItem?.style?.caption) {
                 e.currentTarget.style.backgroundColor = '#F0F9FF';
                 e.currentTarget.style.borderColor = '#93C5FD';
               }
             }}
             onMouseLeave={(e) => {
               if (!textItem?.style?.caption) {
                 e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                 e.currentTarget.style.borderColor = '#E5E5E5';
               }
             }}
           >
             <Type size={16} />
           </button>
           
           {/* Caption Background Toggle */}
           <button
             onClick={(e) => {
               e.stopPropagation();
               e.preventDefault();
               onCaptionBackgroundToggle && onCaptionBackgroundToggle(slideIndex, textIndex);
             }}
             onMouseDown={(e) => {
               e.stopPropagation();
               e.preventDefault();
             }}
             onFocus={(e) => {
               e.stopPropagation();
             }}
             style={{
               width: '32px',
               height: '32px',
               borderRadius: '50%',
               backgroundColor: textItem?.style?.captionBackground ? '#3B82F6' : 'rgba(255, 255, 255, 0.9)',
               border: '1px solid #E5E5E5',
               cursor: 'pointer',
               display: 'flex',
               justifyContent: 'center',
               alignItems: 'center',
               fontSize: '14px',
               color: textItem?.style?.captionBackground ? 'white' : '#374151',
               boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
               transition: 'all 0.2s ease'
             }}
             onMouseEnter={(e) => {
               if (!textItem?.style?.captionBackground) {
                 e.currentTarget.style.backgroundColor = '#F0F9FF';
                 e.currentTarget.style.borderColor = '#93C5FD';
               }
             }}
             onMouseLeave={(e) => {
               if (!textItem?.style?.captionBackground) {
                 e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                 e.currentTarget.style.borderColor = '#E5E5E5';
               }
             }}
           >
             <div style={{
               width: '12px',
               height: '12px',
               backgroundColor: '#000',
               borderRadius: '2px'
             }} />
           </button>
           
           <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onFontSizeDecrease && onFontSizeDecrease(slideIndex, textIndex);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onFocus={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #E5E5E5',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '14px',
          color: '#374151',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#FEF2F2';
          e.currentTarget.style.borderColor = '#FCA5A5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.borderColor = '#E5E5E5';
        }}
      >
        -
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onFontSizeIncrease && onFontSizeIncrease(slideIndex, textIndex);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onFocus={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #E5E5E5',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '14px',
          color: '#374151',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F0F9FF';
          e.currentTarget.style.borderColor = '#93C5FD';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.borderColor = '#E5E5E5';
        }}
      >
        +
      </button>
    </div>
  );
} 