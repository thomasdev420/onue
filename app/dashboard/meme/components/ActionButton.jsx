'use client';

import React from 'react';

export default function ActionButton({
  onClick,
  icon,
  content,
  fontSize = '14px',
  fontWeight = 'normal',
  color = '#374151',
  hoverBgColor = '#F3F4F6',
  hoverBorderColor = '#D1D5DB',
  rainbowBorder = false
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: rainbowBorder ? '2.5px solid transparent' : '1px solid #E5E5E5',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontSize,
        fontWeight,
        color,
        transition: 'all 0.2s ease',
        ...(rainbowBorder ? {
          background: 'linear-gradient(white, white) padding-box, conic-gradient(from 0deg, #ff0080, #7928ca, #007cf0, #00dfd8, #ff0080) border-box',
        } : {})
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBgColor;
        e.currentTarget.style.borderColor = hoverBorderColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        e.currentTarget.style.borderColor = rainbowBorder ? 'transparent' : '#E5E5E5';
      }}
    >
      {icon || content}
    </button>
  );
} 