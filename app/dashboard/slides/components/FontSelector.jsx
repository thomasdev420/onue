'use client';

import React, { useState } from 'react';
import { ChevronDown, Type } from 'lucide-react';
import { FONT_OPTIONS } from '../../../shared/constants/fontOptions.js';

export default function FontSelector({ 
  selectedFont, 
  onFontChange, 
  isOpen, 
  onToggle 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleFontSelect = (font) => {
    onFontChange(font);
    setIsDropdownOpen(false);
  };

  const currentFont = selectedFont ? FONT_OPTIONS.find(f => f.id === selectedFont) : FONT_OPTIONS[0];

  return (
    <div data-font-selector style={{ position: 'relative' }}>
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
          minWidth: '120px',
        }}
      >
        <Type size={16} />
        <span style={{ 
          fontFamily: currentFont?.family || 'Inter, sans-serif',
          fontWeight: currentFont?.weight || '400'
        }}>
          {currentFont?.name || 'Inter'}
        </span>
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
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1001,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginBottom: '4px',
                }}
              >
          {FONT_OPTIONS.map((font) => (
                              <button
                    key={font.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleFontSelect(font);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'background-color 0.2s ease',
                      fontFamily: font.family,
                      fontWeight: font.weight,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
              {font.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 