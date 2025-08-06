'use client';

import React, { useState } from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import { TEXT_COLORS } from '../../../shared/constants/fontOptions.js';

export default function ColorSelector({ 
  selectedColor, 
  onColorChange 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleColorSelect = (color) => {
    onColorChange(color);
    setIsDropdownOpen(false);
  };

  const currentColor = selectedColor ? TEXT_COLORS.find(c => c.hex === selectedColor) : TEXT_COLORS[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsDropdownOpen(!isDropdownOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onFocus={(e) => {
          e.stopPropagation();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: '8px',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#374151',
          transition: 'all 0.2s ease',
          minWidth: '100px',
        }}
      >
        <Palette size={16} />
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: currentColor?.hex || '#FFFFFF',
            border: '1px solid #D1D5DB'
          }}
        />
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>
      
      {isDropdownOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            backgroundColor: 'white',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1001,
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: '4px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            padding: '8px',
            minWidth: '200px'
          }}
        >
          {TEXT_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleColorSelect(color);
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
                backgroundColor: color.hex,
                border: '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#3B82F6';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.transform = 'scale(1)';
              }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );
} 