'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronUp, Sparkles, Loader2, X, Send, User, Bot } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getCurrentUserBusinessContext } from '../../services/businessContextService';

const isDev = process.env.NODE_ENV === 'development';

export default function ChatBar({ actions = [], docked = false, onMessageSubmit }) {
  const { data: session, status } = useSession();

  // In dev, always treat as authenticated
  const effectiveStatus = isDev ? 'authenticated' : status;
  const effectiveSession = useMemo(() => {
    return isDev
      ? { user: { name: 'Dev User', email: 'dev@local.com' } }
      : session;
  }, [session]);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState(null);
  const [error, setError] = useState('');
  const [businessContext, setBusinessContext] = useState(null);
  const [businessContextFetched, setBusinessContextFetched] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  // Track if we are waiting for content type clarification
  const [awaitingContentType, setAwaitingContentType] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState(null);

  // Fetch business context on mount only
  useEffect(() => {
    console.log('ChatBar: business context useEffect triggered, fetched:', businessContextFetched);
    if (businessContextFetched) return;
    
    const fetchBusinessContext = async () => {
      console.log('ChatBar: fetching business context');
      try {
        const context = await getCurrentUserBusinessContext();
        setBusinessContext(context);
      } catch (error) {
        console.error('Error fetching business context:', error);
      } finally {
        setBusinessContextFetched(true);
        console.log('ChatBar: business context fetch completed');
      }
    };
    fetchBusinessContext();
  }, [businessContextFetched]); // Only depend on the fetch flag

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (effectiveStatus !== 'authenticated') {
      setError('Please sign in to use this feature');
      return;
    }

    const userMessage = prompt.trim();
    setPrompt('');
    setIsGenerating(true);
    setError('');

    // Add user message to chat history
    const newUserMessage = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, newUserMessage]);
    if (onMessageSubmit) onMessageSubmit();

    // If we are awaiting content type clarification, treat this as the answer
    if (awaitingContentType && pendingUserMessage) {
      setAwaitingContentType(false);
      setPendingUserMessage(null);
      // Combine the pending message and the user's clarification
      const fullPrompt = `${pendingUserMessage} [User clarification: ${userMessage}]`;
      try {
        const response = await fetch('/api/generate-slides', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            slideCount: 3,
            businessContext: businessContext
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate slides');
        }
        const data = await response.json();
        setGeneratedSlides(data.slides);
        setShowAIModal(true);
        const aiMessage = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'ai',
          content: `I've generated ${data.slides.length} slides for you! Click "Use These Slides" to apply them to your project.`,
          timestamp: new Date(),
          isSlideResponse: true
        };
        setChatHistory(prev => [...prev, aiMessage]);
      } catch (err) {
        setError(err.message || 'Failed to process request');
        const errorMessage = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'ai',
          content: `Sorry, I encountered an error: ${err.message}`,
          timestamp: new Date(),
          isError: true
        };
        setChatHistory(prev => [...prev, errorMessage]);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    try {
      console.log('Sending AI request:', {
        prompt: userMessage,
        businessContext
      });

      // Determine if this is a slide generation request or general AI question
      const isSlideRequest = userMessage.toLowerCase().includes('slide') || 
                            userMessage.toLowerCase().includes('create') ||
                            userMessage.toLowerCase().includes('generate') ||
                            userMessage.toLowerCase().includes('make') ||
                            userMessage.toLowerCase().includes('content') ||
                            userMessage.toLowerCase().includes('post') ||
                            userMessage.toLowerCase().includes('carousel') ||
                            userMessage.toLowerCase().includes('meme') ||
                            userMessage.toLowerCase().includes('listicle') ||
                            userMessage.toLowerCase().includes('educational') ||
                            userMessage.toLowerCase().includes('promotional') ||
                            userMessage.toLowerCase().includes('inspirational');

      // If it's a slide/content request but lacks specific content details, ask for clarification
      if (isSlideRequest && !/(carousel|meme|listicle|educational|promotional|inspirational|tips|ideas|instagram|tiktok|twitter|thread|story|ad|video|reel|post|thread|format|style|topic|about|on|for|content|create|generate|make|marketing|business|social|media|brand|product|service|company|startup|entrepreneur|small business|ecommerce|restaurant|fitness|health|beauty|fashion|travel|food|technology|software|app|website|blog|newsletter|email|campaign|strategy|plan|guide|tutorial|how to|what is|why|when|where|who|how)/i.test(userMessage)) {
        setAwaitingContentType(true);
        setPendingUserMessage(userMessage);
        const aiClarifyMessage = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'ai',
          content: "I'd love to help you create content! Could you tell me more about what you'd like to create? For example:\n• What type of content (educational, promotional, inspirational, etc.)?\n• What topic or subject matter?\n• Any specific ideas or themes you have in mind?",
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiClarifyMessage]);
        setIsGenerating(false);
        return;
      }

      if (isSlideRequest) {
        // Handle slide generation
        const response = await fetch('/api/generate-slides', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userMessage,
            slideCount: 3,
            businessContext: businessContext
          }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to generate slides');
        }

        const data = await response.json();
        console.log('Received slides data:', data);
        
        setGeneratedSlides(data.slides);
        setShowAIModal(true);
        
        // Add AI response to chat history
        const aiMessage = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'ai',
          content: `I've generated ${data.slides.length} slides for you! Click "Use These Slides" to apply them to your project.`,
          timestamp: new Date(),
          isSlideResponse: true
        };
        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        // Handle general AI questions
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userMessage,
            businessContext: businessContext
          }),
        });

        console.log('AI Chat response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('AI Chat API Error:', errorData);
          throw new Error(errorData.error || 'Failed to get AI response');
        }

        const data = await response.json();
        console.log('Received AI response:', data);
        
        // Add AI response to chat history
        const aiMessage = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'ai',
          content: data.response,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to process request');
      
      // Add error message to chat history
      const errorMessage = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        type: 'ai',
        content: `Sorry, I encountered an error: ${err.message}`,
        timestamp: new Date(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-expand textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && chatHistory.length > 0) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: chatHistory.length > 1 ? 'smooth' : 'auto',
      });
    }
  }, [chatHistory]);

  // Adjust textarea height when prompt changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  const handleUseSlides = () => {
    // Navigate to slides page with generated slides
    if (generatedSlides) {
      // Store slides in localStorage for the slides page to pick up
      localStorage.setItem('aiGeneratedSlides', JSON.stringify(generatedSlides));
      window.location.href = '/dashboard/slides';
    }
  };

  // Show loading state while authentication is being determined
  if (effectiveStatus === 'loading') {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8">
        <div className="flex items-center justify-center bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm">
          <Loader2 size={20} className="animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`w-full max-w-2xl mx-auto mt-8${docked ? ' fixed bottom-0 left-1/2 -translate-x-1/2 z-50 p-4' : ''}`}
        style={docked ? { background: 'none', border: 'none', borderRadius: 0, boxShadow: 'none', margin: 0, width: '100%', maxWidth: '640px' } : {}}
      >
        {/* Chat History (only if there are messages) */}
        {chatHistory.length > 0 && (
          <div
            ref={chatContainerRef}
            style={{
              minHeight: 0,
              maxHeight: '80vh',
              overflowY: 'auto',
              width: '100%',
              background: 'none',
              border: 'none',
              borderRadius: 0,
              marginBottom: '1.5rem',
              padding: 0,
              scrollbarWidth: 'none', // Firefox
            }}
            className="hide-scrollbar"
          >
            <div className="space-y-4">
              {chatHistory.map((message, idx) => (
                <div key={message.id} className={`w-full flex ${message.type === 'user' ? 'justify-end' : message.type === 'ai' ? 'justify-start' : 'justify-center'}`} style={{ background: 'none' }}>
                  {message.type === 'context' ? (
                    <div className="text-base text-gray-900 whitespace-pre-line max-w-2xl w-full text-left" style={{ background: 'none', padding: 0, margin: '8px 0' }}>
                      {message.content}
                    </div>
                  ) : (
                    <div
                      className={`text-base whitespace-pre-line max-w-[80%] ${message.type === 'user' ? 'text-gray-900' : message.isError ? 'text-red-700' : 'text-gray-900'} ${message.type === 'user' ? 'bg-blue-50' : 'bg-white'} shadow-sm px-4 py-2 rounded-2xl`}
                    style={{
                      marginLeft: message.type === 'user' ? 'auto' : 0,
                      marginRight: message.type === 'ai' ? 'auto' : 0,
                        border: '1px solid #e5e7eb',
                        fontWeight: message.type === 'user' ? 500 : 400,
                        background: message.type === 'user' ? '#eaf3fb' : '#fff',
                        color: message.type === 'user' ? '#1e293b' : '#222',
                        marginTop: 4,
                        marginBottom: 4
                    }}
                  >
                    {message.content}
                    {message.isSlideResponse && (
                      <button
                        onClick={handleUseSlides}
                        className="mt-3 w-full bg-blue-500 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        Use These Slides
                      </button>
                    )}
                  </div>
                  )}
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="text-base text-gray-600" style={{ background: 'none', border: 'none', borderRadius: 0, padding: 0 }}>
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Input Area */}
        <div
          className={`flex w-full ${docked ? '' : 'bg-white border border-neutral-400 rounded-xl'}`}
          style={{ alignItems: 'center', ...(
            docked
              ? {
                  background: '#fff',
                  border: '1.5px solid #a3a3a3', // darker border
                  borderRadius: '18px',
                  boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)',
                  padding: '8px 16px',
                  minHeight: '48px',
                  margin: '0 auto',
                  maxWidth: '1000px',
                }
              : { padding: '12px', minHeight: '48px' }
          )}}
        >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[40px] max-h-32 resize-none bg-transparent outline-none text-base text-gray-900 placeholder-gray-400 border-none flex-1"
              placeholder={effectiveStatus === 'authenticated' 
                ? "Send a message..."
                : "Please sign in to start creating content"
              }
              disabled={isGenerating || effectiveStatus !== 'authenticated'}
              style={{
                boxShadow: 'none',
                width: '100%',
                paddingLeft: 0,
                paddingRight: 0,
                boxSizing: 'border-box',
                background: 'none',
                border: 'none',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            />
            <button 
              onClick={handleSubmit}
              disabled={isGenerating || !prompt.trim() || effectiveStatus !== 'authenticated'}
              style={{
                ...(docked
                  ? {
                      marginLeft: '12px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #b4d8f8 0%, #b7cfff 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '18px',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.1s ease',
                      cursor: isGenerating || !prompt.trim() || effectiveStatus !== 'authenticated' ? 'not-allowed' : 'pointer',
                      opacity: 1, // always fully opaque
                      filter: 'none', // never dim
                      outline: 'none',
                      overflow: 'hidden',
                      alignSelf: 'center',
                    }
                  : {
                      marginLeft: '12px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '18px',
                      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.1s ease',
                      cursor: isGenerating || !prompt.trim() || effectiveStatus !== 'authenticated' ? 'not-allowed' : 'pointer',
                      opacity: 1, // always fully opaque
                      filter: 'none', // never dim
                      outline: 'none',
                      overflow: 'hidden',
                      alignSelf: 'center',
                    }
                )
              }}
              className="send-btn-no-dim"
              onMouseEnter={e => { if (!(isGenerating || !prompt.trim() || effectiveStatus !== 'authenticated')) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isGenerating ? (
                <Loader2 size={20} className="animate-spin" style={{ position: 'relative', zIndex: 2 }} />
              ) : (
                <Send size={20} style={{ position: 'relative', zIndex: 2 }} />
              )}
            </button>
          </div>
        
        {error && (
          <div className="text-red-500 text-sm text-center mt-2">{error}</div>
        )}

        {effectiveStatus === 'unauthenticated' && (
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm mb-2">Please sign in to use the AI features</p>
            <Link href="/login">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Sign In
              </button>
            </Link>
          </div>
        )}

        {!docked && (
        <div className="flex gap-3 justify-center mt-4 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {actions.map((action, idx) => (
            action.href ? (
              <Link
                key={idx}
                href={action.href}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-medium transition-colors group"
              >
                <span className="text-gray-500 group-hover:text-blue-500 transition-colors">{action.icon}</span>
                {action.label}
              </Link>
            ) : (
              <button
                key={idx}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-medium transition-colors group"
              >
                <span className="text-gray-500 group-hover:text-blue-500 transition-colors">{action.icon}</span>
                {action.label}
              </button>
            )
          ))}
        </div>
        )}
      </div>

      {/* AI Generated Slides Modal */}
      {showAIModal && generatedSlides && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 relative">
              <button 
                onClick={() => setShowAIModal(false)} 
                className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <Sparkles size={24} color="#3B82F6" />
                <h2 className="text-2xl font-bold text-gray-900">
                  AI Generated Slides
                </h2>
              </div>
              <p className="text-gray-600 mt-2">
                Your slides are ready! Review them below and use them in the slides editor.
              </p>
            </div>

            {/* Slides Preview */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {generatedSlides.map((slide, index) => (
                  <div key={slide.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">Slide {index + 1}</div>
                    <div className="space-y-2">
                      {slide.texts.map((text, textIndex) => (
                        <div key={text.id} className="text-sm font-medium text-gray-800">
                          &quot;{text.content}&quot;
                        </div>
                      ))}
                    </div>
                    {slide.image && (
                      <div className="mt-3 text-xs text-gray-500">
                        Image: {slide.image.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowAIModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUseSlides}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Sparkles size={16} />
                Use in Slides Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 