'use client';

import React from 'react';
import Image from "next/image";
import { X, ChevronDown } from 'lucide-react';

export default function ContentModal({
  isOpen,
  onClose,
  contentType,
  setContentType,
  isDropdownOpen,
  setIsDropdownOpen,
  libraryImages,
  userImages,
  onImageSelect
}) {
  if (!isOpen) return null;

  const renderContent = () => {
    let imagesToShow = [];
    if (contentType === 'stock') {
      imagesToShow = libraryImages;
    } else if (contentType === 'user') {
      imagesToShow = userImages;
    }

    return (
      <div className="grid grid-cols-4 gap-2 p-2">
        {imagesToShow.map((image) => (
          <div 
            key={image.id} 
            className="cursor-pointer relative aspect-square" 
            onClick={() => onImageSelect(image)}
          >
            <Image
              src={image.image_url || image.url}
              alt={image.title || 'User image'}
              fill
              sizes="200px"
              className="rounded-lg object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

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
          backgroundColor: '#FFF',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
          width: '80%',
          maxWidth: '1000px',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
          }}
        >
          <X size={24} color="#555" />
        </button>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
          <div>
            <div className="flex-1 flex flex-col min-h-0">
              {/* Content Library Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                    className="w-full bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 inline-flex justify-between items-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    {contentType === 'stock' ? 'Stock Photos' : 'Your Photos'}
                    <ChevronDown className="-mr-1 ml-2 h-5 w-5" />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-100">
                      <ul className="p-1">
                        {contentType !== 'stock' && (
                          <li>
                            <a
                              href="#"
                              onClick={(e) => { 
                                e.preventDefault(); 
                                setContentType('stock'); 
                                setIsDropdownOpen(false); 
                              }}
                              className="block px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 text-gray-700 hover:bg-[#ff4514]/10 hover:text-[#ff4514]"
                            >
                              Stock Photos
                            </a>
                          </li>
                        )}
                        {contentType !== 'user' && (
                          <li>
                            <a
                              href="#"
                              onClick={(e) => { 
                                e.preventDefault(); 
                                setContentType('user'); 
                                setIsDropdownOpen(false); 
                              }}
                              className="block px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 text-gray-700 hover:bg-[#ff4514]/10 hover:text-[#ff4514]"
                            >
                              Your Photos
                            </a>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 