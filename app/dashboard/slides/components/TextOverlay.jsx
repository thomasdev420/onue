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
  onClick
}) {
  const textRef = React.useRef(null);

  const getTextStyle = () => {
    return {
      position: 'absolute',
      left: `${textItem.position.x}%`,
      top: `${textItem.position.y}%`,
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'normal',
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
      fontFamily: "'Inter', sans-serif",
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
      fontFamily: "'Inter', sans-serif",
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
          onBlur={onBlur}
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
    </div>
  );
} 