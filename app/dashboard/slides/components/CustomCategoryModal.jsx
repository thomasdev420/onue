'use client';

import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

export default function CustomCategoryModal({
  isOpen,
  onClose,
  onCategoryCreated
}) {
  const [customCategoryTitle, setCustomCategoryTitle] = useState('');
  const [customCategoryImages, setCustomCategoryImages] = useState([]);

  const handleCreateCategory = () => {
    if (customCategoryTitle.trim() && customCategoryImages.length > 0) {
      // Create new custom category
      const newCategory = {
        id: Date.now().toString(),
        title: customCategoryTitle.trim(),
        images: customCategoryImages
      };
      
      onCategoryCreated(newCategory);
      handleClose();
    }
  };

  const handleClose = () => {
    setCustomCategoryTitle('');
    setCustomCategoryImages([]);
    onClose();
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
        zIndex: 1100,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#FFF',
          borderRadius: '24px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '520px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            color: '#9CA3AF',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
        >
          <X size={24} />
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#23272F',
            marginBottom: '8px',
            fontFamily: "'Inter', sans-serif"
          }}>
            Create Custom Category
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6B7280',
            fontFamily: "'Inter', sans-serif"
          }}>
            Add your own category with custom images
          </div>
        </div>

        {/* Category Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#23272F',
            marginBottom: '8px',
            fontFamily: "'Inter', sans-serif"
          }}>
            Category Title
          </div>
          <input
            type="text"
            value={customCategoryTitle}
            onChange={(e) => setCustomCategoryTitle(e.target.value)}
            placeholder="e.g. My Brand, Product Photos, Team Pictures"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '2px solid #E5E7EB',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#23272F',
            marginBottom: '8px',
            fontFamily: "'Inter', sans-serif"
          }}>
            Upload Images
          </div>
          <div style={{
            border: '2px dashed #E5E7EB',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: '#F9FAFB'
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e) => {
              const files = Array.from(e.target.files);
              setCustomCategoryImages(prev => [...prev, ...files]);
            };
            input.click();
          }}
          >
            <Upload size={32} color="#9CA3AF" style={{ marginBottom: '8px' }} />
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              fontFamily: "'Inter', sans-serif",
              marginBottom: '4px'
            }}>
              Click to upload images
            </div>
            <div style={{
              fontSize: '12px',
              color: '#9CA3AF',
              fontFamily: "'Inter', sans-serif"
            }}>
              PNG, JPG, GIF up to 10MB each
            </div>
          </div>
        </div>

        {/* Uploaded Images Preview */}
        {customCategoryImages.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#23272F',
              marginBottom: '12px',
              fontFamily: "'Inter', sans-serif"
            }}>
              Uploaded Images ({customCategoryImages.length})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '8px',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {customCategoryImages.map((file, index) => (
                <div key={index} style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB'
                }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomCategoryImages(prev => prev.filter((_, i) => i !== index));
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: '#FFF',
              color: '#374151',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateCategory}
            disabled={!customCategoryTitle.trim() || customCategoryImages.length === 0}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: !customCategoryTitle.trim() || customCategoryImages.length === 0 ? '#A5B4FC' : '#2563EB',
              color: '#FFF',
              fontWeight: '600',
              fontSize: '14px',
              cursor: !customCategoryTitle.trim() || customCategoryImages.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s ease'
            }}
          >
            Create Category
          </button>
        </div>
      </div>
    </div>
  );
} 