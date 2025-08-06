'use client';

import React, { useState, useEffect } from 'react';
import { X, Palette, Clock } from 'lucide-react';

// Utility function to save recent colors to localStorage
const saveRecentColor = (color) => {
  try {
    const recentColors = JSON.parse(localStorage.getItem('recentColors') || '[]');
    const newRecentColors = [color, ...recentColors.filter(c => c.hex !== color.hex)].slice(0, 5);
    localStorage.setItem('recentColors', JSON.stringify(newRecentColors));
  } catch (error) {
    console.error('Error saving recent color:', error);
  }
};

// Utility function to get recent colors from localStorage
const getRecentColors = () => {
  try {
    return JSON.parse(localStorage.getItem('recentColors') || '[]');
  } catch (error) {
    console.error('Error loading recent colors:', error);
    return [];
  }
};

export default function ColorBackgroundModal({
  isOpen,
  onClose,
  onColorSelect
}) {
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [recentColors, setRecentColors] = useState([]);

  // Load recent colors on component mount
  useEffect(() => {
    if (isOpen) {
      setRecentColors(getRecentColors());
    }
  }, [isOpen]);

  const handleColorSelect = (color) => {
    const colorData = {
      type: 'color',
      id: `custom-${Date.now()}`,
      name: `Custom Color`,
      hex: color,
      rgb: hexToRgb(color),
      backgroundColor: color
    };
    
    saveRecentColor(colorData);
    onColorSelect(colorData);
    onClose();
  };

  const handleRecentColorSelect = (colorData) => {
    onColorSelect(colorData);
    onClose();
  };

  // Utility function to convert hex to rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          boxSizing: 'border-box',
          margin: '20px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Choose Background Color
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#9CA3AF',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Color Picker Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Palette size={20} color="#6B7280" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
              Pick a Color
            </h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{
                width: '60px',
                height: '60px',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: 'transparent',
              }}
            />
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                backgroundColor: selectedColor, 
                height: '60px', 
                borderRadius: '12px',
                border: '2px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedColor === '#FFFFFF' ? '#374151' : 'white',
                fontSize: '14px',
                fontWeight: '500',
                textShadow: selectedColor === '#FFFFFF' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                {selectedColor}
              </div>
            </div>
            
            <button
              onClick={() => handleColorSelect(selectedColor)}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563EB';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3B82F6';
              }}
            >
              Use Color
            </button>
          </div>
        </div>

        {/* Recent Colors Section */}
        {recentColors.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Clock size={20} color="#6B7280" />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
                Recent Colors
              </h3>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', 
              gap: '12px',
              maxWidth: '100%'
            }}>
              {recentColors.map((colorData, index) => (
                <div
                  key={`${colorData.hex}-${index}`}
                  onClick={() => handleRecentColorSelect(colorData)}
                  style={{
                    aspectRatio: '1',
                    backgroundColor: colorData.hex,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    lineHeight: '1'
                  }}>
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Color Presets */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 16px 0' }}>
            Quick Colors
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))', 
            gap: '8px'
          }}>
            {[
              '#FFFFFF', '#000000', '#3B82F6', '#EF4444', '#10B981', 
              '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#F3F4F6'
            ].map((color) => (
              <div
                key={color}
                onClick={() => handleColorSelect(color)}
                style={{
                  aspectRatio: '1',
                  backgroundColor: color,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          backgroundColor: '#F9FAFB', 
          borderRadius: '12px',
          border: '1px solid #E5E7EB'
        }}>
          <p style={{ 
            fontSize: '14px', 
            color: '#6B7280', 
            margin: 0,
            lineHeight: '1.5'
          }}>
            Use the color picker to choose any color, or select from your recent colors. Your 5 most recent color choices are automatically saved.
          </p>
        </div>
      </div>
    </div>
  );
} 