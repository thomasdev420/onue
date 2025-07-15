'use client';

import React from 'react';

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
  onDeleteText
}) {
  const textRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  const getTextStyle = () => {
    const aiStyle = textItem.style || {};
    const fontSize = aiStyle.fontSize || '16px';
    
    // Debug logging
    console.log('TextOverlay - textItem:', textItem);
    console.log('TextOverlay - aiStyle:', aiStyle);
    console.log('TextOverlay - fontSize:', fontSize);
    
    return {
      position: 'absolute',
      left: `${textItem.position.x}%`,
      top: `${textItem.position.y}%`,
      transform: 'translate(-50%, -50%)',
      color: aiStyle.color || 'white',
      fontSize: fontSize,
      fontWeight: aiStyle.fontWeight || 'normal',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: slideIndex === activeSlideIndex ? 'move' : 'default',
      userSelect: 'none',
      width: isInlineEditing ? 'auto' : (isBeingDragged ? `${draggingInfo.elementWidth}px` : (textItem.width ? `${textItem.width}px` : 'auto')),
      height: isInlineEditing ? 'auto' : (isBeingDragged ? `${draggingInfo.elementHeight}px` : (textItem.height ? `${textItem.height}px` : 'auto')),
      minWidth: '300px',
      maxWidth: '98vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      overflowWrap: 'normal',
      whiteSpace: 'pre-wrap',
      fontFamily: "sans-serif",
      lineHeight: '1.2',
      letterSpacing: '0.3px',
    };
  };

  const getTextareaStyle = () => {
    const aiStyle = textItem.style || {};
    
    return {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: aiStyle.color || 'white',
      fontSize: aiStyle.fontSize || '18px',
      fontFamily: "sans-serif",
      fontWeight: aiStyle.fontWeight || 'normal',
      textAlign: 'center',
      width: '100%',
      padding: '0',
      margin: 'auto 0',
      lineHeight: '1.2',
      letterSpacing: '0.5px',
      resize: 'none',
      overflow: 'hidden',
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
            // Don't blur if clicking on font size buttons
            if (e.relatedTarget && e.relatedTarget.closest('[data-font-size-controls]')) {
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
        <span>
          {textItem.content}
        </span>
      )}
      
      {/* Font Size Controls - Only show when slide is active and text is being edited */}
      {slideIndex === activeSlideIndex && isInlineEditing && (
        <div 
          data-font-size-controls
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            zIndex: 1001
          }}
        >
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
          
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDeleteText && onDeleteText(slideIndex, textIndex);
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
              color: '#EF4444',
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
            ×
          </button>
        </div>
      )}
    </div>
  );
} 