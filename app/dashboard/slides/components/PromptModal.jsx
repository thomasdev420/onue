'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Send, Plus, Upload } from 'lucide-react';
import { CATEGORIES } from '../../../shared/constants/imageCategories.js';
import { useRouter } from 'next/navigation';
import CustomCategoryModal from './CustomCategoryModal';

export default function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  businessContext = null,
  existingSlides = [],
  mode = 'slides',
  initialPrompt = '',
  libraryImages = []
}) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [slideCount, setSlideCount] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const [isCustomCategoryModalOpen, setIsCustomCategoryModalOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const textareaRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt || '');
      setError('');
      setIsGenerating(false);
    }
  }, [isOpen, initialPrompt]);

  // Auto-expand textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };
  useEffect(() => { adjustTextareaHeight(); }, [prompt]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Convert word numbers to digits (e.g., "ten" -> "10")
  const convertWordToNumber = (text) => {
    const wordToNumber = {
      'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
      'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
      'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20'
    };
    
    let convertedText = text.toLowerCase();
    for (const [word, number] of Object.entries(wordToNumber)) {
      convertedText = convertedText.replace(new RegExp(`\\b${word}\\b`, 'gi'), number);
    }
    return convertedText;
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    if (mode !== 'text' && !selectedCategory) {
      setError('Please select a category before generating slides');
      return;
    }
    setError('');
    setIsGenerating(true);
    const userMessage = prompt.trim();
    setPrompt('');
    
    console.log('Starting AI generation with prompt:', userMessage);
    console.log('Business context:', businessContext);
    console.log('Existing slides count:', existingSlides?.length || 0);

    // Convert word numbers to digits for better extraction
    const processedMessage = convertWordToNumber(userMessage);
    console.log('Processed message for number extraction:', processedMessage);

    // Let the AI figure out the intent from the user's prompt
    let finalSlideCount = slideCount;
    
    // Check if this is a "more slides" request
    const isMoreSlidesRequest = existingSlides && existingSlides.length > 0 && (
      userMessage.toLowerCase().includes('more') || 
      userMessage.toLowerCase().includes('additional') || 
      userMessage.toLowerCase().includes('continue') || 
      userMessage.toLowerCase().includes('add') ||
      userMessage.toLowerCase().includes('extra')
    );
    
    if (isMoreSlidesRequest) {
      // For "more slides" requests, extract the number of additional slides
      let slideCountMatch = processedMessage.match(/(\d+)\s*(?:more|additional|extra)?\s*(?:slides?|slide)/i);
      if (slideCountMatch) {
        const requestedCount = parseInt(slideCountMatch[1]);
        console.log('Extracted "more slides" count:', requestedCount);
        if (requestedCount >= 1 && requestedCount <= 20) {
          finalSlideCount = requestedCount;
          console.log('Using "more slides" count:', finalSlideCount);
        } else {
          console.log('More slides count out of range (1-20):', requestedCount);
        }
      } else {
        // Try to extract numbers for prompts like '3 more facts', '5 additional tips', etc.
        const genericCountMatch = processedMessage.match(/(\d+)\s*(?:more|additional|extra)?\s*(?:facts?|reasons?|tips?|secrets?|ideas?|lessons?|ways|methods|strategies|things|steps)/i);
        if (genericCountMatch) {
          const requestedCount = parseInt(genericCountMatch[1]);
          console.log('Extracted "more generic" count:', requestedCount);
          if (requestedCount >= 1 && requestedCount <= 20) {
            finalSlideCount = requestedCount;
            console.log('Using "more generic" count:', finalSlideCount);
          } else {
            console.log('More generic count out of range (1-20):', requestedCount);
          }
        } else {
          // Default to 3 additional slides for "more slides" requests
          finalSlideCount = 3;
          console.log('Using default "more slides" count:', finalSlideCount);
        }
      }
    } else {
      // For new slide sets, try to extract explicit slide count (e.g., '3 slides')
      let slideCountMatch = processedMessage.match(/(\d+)\s*(?:slides?|slide)/i);
      if (slideCountMatch) {
        const requestedCount = parseInt(slideCountMatch[1]);
        console.log('Extracted slide count from prompt:', requestedCount);
        if (requestedCount >= 1 && requestedCount <= 20) {
          finalSlideCount = requestedCount;
          console.log('Using extracted slide count:', finalSlideCount);
        } else {
          console.log('Slide count out of range (1-20):', requestedCount);
        }
      } else {
        // Try to extract numbers for prompts like '3 facts', '5 reasons', etc.
        const genericCountMatch = processedMessage.match(/(\d+)\s*(?:facts?|reasons?|tips?|secrets?|ideas?|lessons?|ways|methods|strategies|things|steps)/i);
        if (genericCountMatch) {
          const requestedCount = parseInt(genericCountMatch[1]);
          console.log('Extracted generic count from prompt:', requestedCount);
          if (requestedCount >= 1 && requestedCount <= 20) {
            finalSlideCount = requestedCount + 1; // +1 for intro slide
            console.log('Using generic count + 1 for intro:', finalSlideCount);
          } else {
            console.log('Generic count out of range (1-20):', requestedCount);
          }
        }
      }
    }
    
    try {
      console.log('Sending request to unified content engine with:', {
        prompt: userMessage,
        slideCount: finalSlideCount,
        businessContext: businessContext,
        existingSlides: existingSlides?.length || 0,
        selectedCategory: selectedCategory
      });
      
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          slideCount: finalSlideCount,
          businessContext: businessContext,
          userInfo: {
            name: 'User',
            email: 'user@example.com'
          },
          forceGenerate: true,
          existingSlides: existingSlides || [],
          selectedCategory: selectedCategory,
          mode: mode
        }),
      });
      
      console.log('API response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate slides');
      }
      const data = await response.json();
      console.log('API response received:', data);
      console.log('Slides from API:', data.slides);
      
      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error('Invalid response format: slides array not found');
      }
      
      // Let the AI response determine the final content
      // The AI should return the complete content based on user intent
      let finalSlides = data.slides;
      
      // Automatically apply the generated slides
      onSubmit(finalSlides, userMessage);
      setIsGenerating(false);
      onClose();
      
    } catch (err) {
      setError(err.message || 'Failed to generate slides');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  // Full-screen loading overlay when generating
  if (isGenerating) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          textAlign: 'center',
          color: 'white'
        }}>
          <Loader2 size={48} className="animate-spin" />
          <div style={{ fontSize: '20px', fontWeight: '600' }}>
            Generating slides...
          </div>
        </div>
      </div>
    );
  }

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
          borderRadius: '24px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '520px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          boxSizing: 'border-box',
          marginTop: '-150px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isGenerating}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'none',
            border: 'none',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            padding: '8px',
            borderRadius: '8px',
            color: '#9CA3AF',
            transition: 'all 0.2s ease',
            opacity: isGenerating ? 0.5 : 1,
            zIndex: 10,
          }}
        >
          <X size={24} />
        </button>


        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#23272F',
            marginBottom: '12px',
            fontFamily: "'Inter', sans-serif"
          }}>
            Text Prompt
          </div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g. make five slides about x have an intro slide and a conclusion slide"
            disabled={isGenerating}
            style={{
              width: '100%',
              minHeight: '140px',
              fontSize: '16px',
              color: '#23272F',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              padding: '16px',
              fontFamily: "'Inter', sans-serif",
              boxSizing: 'border-box',
              resize: 'none',
              background: '#FFF',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
        </div>
        
                {/* Image Category Selection - Hidden for text mode */}
        {mode !== 'text' && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#23272F',
              marginBottom: '12px',
              fontFamily: "'Inter', sans-serif"
            }}>
              Image Category
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  background: '#FFF',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: selectedCategory ? '#1E40AF' : '#6B7280',
                  fontWeight: selectedCategory ? '600' : '400',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <span>
                  {selectedCategory?.startsWith('custom_') 
                    ? customCategories.find(cat => `custom_${cat.id}` === selectedCategory)?.title || 'Custom Category'
                    : selectedCategory ? CATEGORIES[selectedCategory].name : 'Select image category'}
                </span>
              </button>
              
              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#FFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  marginTop: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  zIndex: 10,
                  padding: '16px',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  {/* Category Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '12px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
                      const isSelected = selectedCategory === categoryKey;
                      return (
                        <div
                          key={categoryKey}
                          onClick={() => {
                            setSelectedCategory(isSelected ? null : categoryKey);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '12px',
                            padding: '16px',
                            border: isSelected ? '2px solid #2563EB' : '1px solid #E5E7EB',
                            background: isSelected ? '#F0F9FF' : '#FFF',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                        >
                          {/* Category Title */}
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: isSelected ? '#2563EB' : '#374151',
                            marginBottom: '8px',
                            textAlign: 'center'
                          }}>
                            {category.name}
                          </div>
                          
                          {/* Thumbnail Strip */}
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            justifyContent: 'center'
                          }}>
                            {/* Show actual preview images for each category */}
                            {(() => {
                              // Get images for this category
                              const categoryImages = libraryImages?.filter(img => img.category === categoryKey) || [];
                              const previewImages = categoryImages.slice(0, 5);
                              
                              // Fill remaining slots with placeholders if needed
                              const remainingSlots = 5 - previewImages.length;
                              
                              return (
                                <>
                                  {previewImages.map((img, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        border: '1px solid #E5E7EB',
                                        overflow: 'hidden',
                                        background: '#F3F4F6'
                                      }}
                                    >
                                      <img
                                        src={img.image_url || img.url}
                                        alt={img.title || 'Preview'}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover'
                                        }}
                                      />
                                    </div>
                                  ))}
                                  {Array.from({ length: remainingSlots }, (_, index) => (
                                    <div
                                      key={`placeholder-${index}`}
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        background: `linear-gradient(45deg, ${category.color || '#E5E7EB'}, ${category.color || '#F3F4F6'})`,
                                        border: '1px solid #E5E7EB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '8px',
                                        color: '#6B7280'
                                      }}
                                    >
                                      {category.icon}
                                    </div>
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Custom Categories */}
                  {customCategories.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      {customCategories.map((customCategory) => {
                        const isSelected = selectedCategory === `custom_${customCategory.id}`;
                        return (
                          <div
                            key={customCategory.id}
                            onClick={() => {
                              setSelectedCategory(isSelected ? null : `custom_${customCategory.id}`);
                              setIsDropdownOpen(false);
                            }}
                            style={{
                              cursor: 'pointer',
                              borderRadius: '12px',
                              padding: '16px',
                              border: isSelected ? '2px solid #059669' : '1px solid #E5E7EB',
                              background: isSelected ? '#F0FDF4' : '#FFF',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: isSelected ? '#059669' : '#374151',
                              marginBottom: '8px',
                              textAlign: 'center'
                            }}>
                              {customCategory.title}
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: '4px',
                              justifyContent: 'center'
                            }}>
                              {Array.from({ length: Math.min(5, customCategory.images.length) }, (_, index) => (
                                <div
                                  key={index}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    background: 'linear-gradient(45deg, #10B981, #34D399)',
                                    border: '1px solid #E5E7EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    color: '#FFF'
                                  }}
                                >
                                  🎨
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Create Custom Category Button */}
                  <button
                    onClick={() => {
                      setIsCustomCategoryModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px dashed #D1D5DB',
                      background: '#F9FAFB',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      color: '#6B7280',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#F3F4F6';
                      e.target.style.borderColor = '#9CA3AF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#F9FAFB';
                      e.target.style.borderColor = '#D1D5DB';
                    }}
                  >
                    <Plus size={16} />
                    Create Custom Category
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !prompt.trim() || (mode !== 'text' && !selectedCategory)}
            style={{
              height: '56px',
              padding: '0 48px',
              borderRadius: '12px',
              border: 'none',
              background: isGenerating || !prompt.trim() || (mode !== 'text' && !selectedCategory) ? '#E5E7EB' : '#2563EB',
              color: '#FFF',
              fontWeight: '700',
              fontSize: '18px',
              cursor: isGenerating || !prompt.trim() || (mode !== 'text' && !selectedCategory) ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
              boxShadow: isGenerating || !prompt.trim() || (mode !== 'text' && !selectedCategory) ? 'none' : '0 1px 2px rgba(37,99,235,0.08)',
            }}
          >
            Generate
          </button>
        </div>
        {error && (
          <div style={{
            color: '#EF4444',
            fontSize: '14px',
            textAlign: 'center',
            marginTop: '20px',
            maxWidth: '360px',
            fontFamily: "'Inter', sans-serif"
          }}>
            {error}
          </div>
        )}
      </div>
      
      {/* Custom Category Modal */}
      <CustomCategoryModal
        isOpen={isCustomCategoryModalOpen}
        onClose={() => setIsCustomCategoryModalOpen(false)}
        onCategoryCreated={(newCategory) => {
          setCustomCategories(prev => [...prev, newCategory]);
          setSelectedCategory(`custom_${newCategory.id}`);
        }}
      />
    </div>
  );
} 