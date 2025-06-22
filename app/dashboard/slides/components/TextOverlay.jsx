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
  onBlur
}) {
  const textRef = React.useRef(null);

  const getTextStyle = () => ({
    position: 'absolute',
    left: `${textItem.position.x}px`,
    top: `${textItem.position.y}px`,
    transform: 'translate(-50%, -50%)',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: slideIndex === activeSlideIndex ? 'move' : 'default',
    userSelect: 'none',
    width: isInlineEditing ? 'auto' : (isBeingDragged ? `${draggingInfo.elementWidth}px` : (textItem.width ? `${textItem.width}px` : 'auto')),
    height: isInlineEditing ? 'auto' : (isBeingDragged ? `${draggingInfo.elementHeight}px` : (textItem.height ? `${textItem.height}px` : 'auto')),
    minWidth: '50px',
    maxWidth: '30vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  });

  const getTextareaStyle = () => ({
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'white',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 'inherit',
    textAlign: 'center',
    width: '100%',
    padding: '0',
    margin: 'auto 0',
    lineHeight: 'inherit',
    resize: 'none',
    overflow: 'hidden',
  });

  return (
    <div
      ref={textRef}
      data-text-overlay
      onMouseDown={(e) => slideIndex === activeSlideIndex && !isInlineEditing && onMouseDown(e, textIndex)}
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