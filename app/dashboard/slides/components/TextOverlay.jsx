'use client';

import React from 'react';
import FontSelector from './FontSelector';
import ColorSelector from './ColorSelector';
import { Italic } from 'lucide-react';

export default function TextOverlay({
  textItem,
  textIndex,
  slideIndex,
  activeSlideIndex,
  isInlineEditing,
  isBeingDragged,
  draggingInfo,
  inlineEditText,
  inlineEditRef,
  onMouseDown,
  onInlineEditChange,
  onKeyDown,
  onBlur,
  onClick,
  onFontSizeIncrease,
  onFontSizeDecrease,
  onDeleteText,
  onFontChange,
  onColorChange,
  onItalicToggle,
  onCaptionBackgroundToggle
}) {
  const textRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  const getTextStyle = () => {
    const aiStyle = textItem.style || {};
    const fontSize = aiStyle.fontSize || '14px';
    
    // Apply caption style with black outline by default (unless explicitly disabled)
    const textShadow = aiStyle.caption !== false ? 
      '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : 
      'none';
    
    // Use Montserrat bold for caption text, otherwise use the specified font family
    const fontFamily = aiStyle.caption !== false ? 
      'var(--font-montserrat), Montserrat, sans-serif' : 
      (textItem.style?.fontFamily || "Inter, sans-serif");
    
    // Use bold weight for caption text - always bold for captions
    const fontWeight = 'bold'; // Always bold for all text
    
    return {
      position: 'absolute',
      left: `${textItem.position.x}%`,
      top: `${textItem.position.y}%`,
      transform: 'translate(-50%, -50%)',
      color: aiStyle.color || 'white',
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: aiStyle.fontStyle || 'normal',
      textShadow: textShadow,
      backgroundColor: aiStyle.captionBackground ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
      padding: isInlineEditing ? '0px' : (aiStyle.captionBackground ? '8px 16px' : '8px 16px'),
      borderRadius: isInlineEditing ? '0px' : (aiStyle.captionBackground ? '8px' : '4px'),
      cursor: slideIndex === activeSlideIndex ? 'move' : 'default',
      userSelect: 'none',
      width: isInlineEditing ? 'fit-content' : 'max-content',
      maxWidth: '87%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      overflowWrap: 'break-word',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      fontFamily: fontFamily,
      lineHeight: '1.3',
      letterSpacing: '0.2px',
      boxSizing: 'border-box',
      border: isInlineEditing ? '1px dashed #3B82F6' : 'none',
      outline: isInlineEditing ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
      outlineOffset: isInlineEditing ? '2px' : '0',
    };
  };

  const getTextareaStyle = () => {
    const aiStyle = textItem.style || {};
    
    // Use Montserrat bold for caption text during editing
    const fontFamily = aiStyle.caption !== false ? 
      'var(--font-montserrat), Montserrat, sans-serif' : 
      (aiStyle.fontFamily || "Inter, sans-serif");
    
    const fontWeight = 'bold'; // Always bold for all text
    
    return {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: aiStyle.color || 'white',
      fontSize: aiStyle.fontSize || '16px',
      fontFamily: fontFamily,
      fontWeight: fontWeight,
      fontStyle: aiStyle.fontStyle || 'normal',
      textAlign: 'center',
      width: 'max-content',
      minWidth: '200px',
      maxWidth: '90%',
      padding: '0',
      margin: 'auto 0',
      lineHeight: '1.3',
      letterSpacing: '0.2px',
      resize: 'none',
      overflow: 'hidden',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    };
  };

  return (
    <div
      ref={textRef}
      data-text-overlay
      onMouseDown={(e) => slideIndex === activeSlideIndex && !isInlineEditing && onMouseDown(e, textIndex)}
      onClick={(e) => slideIndex === activeSlideIndex && !isInlineEditing && onClick && onClick(e, textIndex)}
      style={getTextStyle()}
    >
      {isInlineEditing ? (
        <textarea
          ref={inlineEditRef}
          value={inlineEditText}
          onChange={onInlineEditChange}
          onBlur={(e) => {
            // Don't blur if clicking on font controls or font selector
            if (e.relatedTarget && (
              e.relatedTarget.closest('[data-font-size-controls]') ||
              e.relatedTarget.closest('[data-font-selector]')
            )) {
              return;
            }
            onBlur();
          }}
          style={getTextareaStyle()}
          onKeyDown={onKeyDown}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />
      ) : (
        <span style={{ 
          display: 'block',
          width: '100%',
          textAlign: 'center',
          fontWeight: textItem.style?.fontWeight || 'normal',
          fontStyle: textItem.style?.fontStyle || 'normal'
        }}>
          {textItem.content}
        </span>
      )}
    </div>
  );
} 