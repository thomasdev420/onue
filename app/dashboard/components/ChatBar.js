'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronUp, Loader2, Send, User, Bot } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getCurrentUserBusinessContext } from '../../services/businessContextService';
import { useClarification } from '../../shared/hooks/useClarification.js';

const isDev = process.env.NODE_ENV === 'development';

export default function ChatBar({ actions = [], docked = false, onMessageSubmit }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // In dev, always treat as authenticated
  const effectiveStatus = isDev ? 'authenticated' : status;
  const effectiveSession = useMemo(() => {
    return isDev
      ? { user: { name: 'Dev User', email: 'dev@local.com' } }
      : session;
  }, [session]);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [businessContext, setBusinessContext] = useState(null);
  const [businessContextFetched, setBusinessContextFetched] = useState(false);
  const [businessContextError, setBusinessContextError] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Clarification system
  const {
    needsClarification,
    handleClarificationRequest,
    submitClarification,
    cancelClarification,
    getClarificationText,
    isWaitingForClarification,
    getOriginalPrompt
  } = useClarification();

  const [pendingContent, setPendingContent] = useState(null); // { type: 'slides'|'videos'|'text'|'images', url: string }

  // Fetch business context only after user is properly authenticated
  useEffect(() => {
    // Only fetch if user is authenticated and we haven't fetched yet
    if (effectiveStatus !== 'authenticated' || businessContextFetched) {
      return;
    }
    
    console.log('ChatBar: business context useEffect triggered, fetched:', businessContextFetched);
    
    const fetchBusinessContext = async () => {
      console.log('ChatBar: fetching business context');
      try {
        const context = await getCurrentUserBusinessContext();
        setBusinessContext(context);
        setBusinessContextError(false);
      } catch (error) {
        console.error('Error fetching business context:', error);
        setBusinessContextError(true);
        // Set a default context so the app doesn't break
        setBusinessContext({
          companyName: 'Your Business',
          businessType: 'General',
          productInfo: 'Your products and services'
        });
      } finally {
        setBusinessContextFetched(true);
        console.log('ChatBar: business context fetch completed');
      }
    };
    
    // Add a small delay to ensure session is fully ready
    const timer = setTimeout(() => {
      fetchBusinessContext();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [effectiveStatus, businessContextFetched]); // Depend on effectiveStatus instead of just the fetch flag

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



    // If we are waiting for clarification, handle the follow-up
    if (isWaitingForClarification()) {
      try {
        const response = await submitClarification(userMessage, async (params) => {
          // For clarification follow-ups, always use chat API
          const chatResponse = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...params,
              businessContext: businessContext,
              userInfo: {
                name: effectiveSession?.user?.name,
                email: effectiveSession?.user?.email
              }
            }),
          });
          if (!chatResponse.ok) {
            const errorData = await chatResponse.json();
            throw new Error(errorData.error || 'Failed to get AI response');
          }
          return await chatResponse.json();
        });
        if (response.response) {
          const aiMessage = {
            id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            type: 'ai',
            content: response.response,
            timestamp: new Date()
          };
          setChatHistory(prev => [...prev, aiMessage]);
        }
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
      // Use chat API for all conversations - no automatic content creation
      // Let the AI have natural conversations about slides, videos, etc.

      // For general questions, use the chat API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          businessContext: businessContext,
          userInfo: {
            name: effectiveSession?.user?.name,
            email: effectiveSession?.user?.email
          }
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }
      const data = await response.json();
      if (needsClarification(data)) {
        handleClarificationRequest(data, userMessage);
        const clarificationMessage = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          isClarification: true,
          needsClarification: true
        };
        setChatHistory(prev => [...prev, clarificationMessage]);
      } else {
        // For general chat responses, display the content normally
        const aiMessage = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'ai',
          content: data.response,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      }
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
                  ) : message.isClarification ? (
                    <div
                      className="text-base whitespace-pre-line max-w-[80%] bg-blue-50 border border-blue-200 text-blue-900 shadow-sm px-4 py-2 rounded-2xl"
                      style={{
                        marginLeft: 0,
                        marginRight: 'auto',
                        fontWeight: 500,
                        background: '#eff6ff',
                        color: '#1e40af',
                        marginTop: 4,
                        marginBottom: 4
                      }}
                    >
                      {message.content}
                      {message.needsClarification && idx === chatHistory.length - 1 && (
                        <div className="mt-3">
                        </div>
                      )}
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
                    {message.isContentReady && pendingContent && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            console.log('View button clicked:', pendingContent);
                            console.log('Redirecting to:', pendingContent.url);
                            router.push(pendingContent.url);
                            setPendingContent(null);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          style={{
                            background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                            boxShadow: '0 2px 8px 0 rgba(147,197,253,0.35)',
                          }}
                        >
                          View {pendingContent.type.charAt(0).toUpperCase() + pendingContent.type.slice(1)}
                        </button>
                      </div>
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
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.55) 0%, rgba(147, 197, 253, 0.15) 100%)',
                  backdropFilter: 'blur(24px) saturate(1.1)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.1)',
                  border: '1.5px solid rgba(147, 197, 253, 0.25)',
                  borderRadius: '18px',
                  boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04), 0 0 0 1px rgba(147, 197, 253, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
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
                ? "Let's get you some users."
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
                      background: 'linear-gradient(135deg, #7ecbff 0%, #4f8cff 100%)', // more vibrant blue
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '18px',
                      boxShadow: '0 2px 8px 0 rgba(147,197,253,0.35), 0 0 8px 2px #b7cfff', // blue glow
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
                      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18), 0 0 8px 2px #b7cfff', // blue glow
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
                <Loader2 size={20} className="animate-spin" style={{ position: 'relative', zIndex: 2, color: '#fff' }} />
              ) : (
                <Send size={20} style={{ position: 'relative', zIndex: 2, color: '#fff', opacity: 1 }} />
              )}
            </button>
          </div>
        
        {error && (
          <div className="text-red-500 text-sm text-center mt-2">{error}</div>
        )}

        {!docked && actions.length > 0 && (
  <div className="flex flex-col items-center gap-2 mt-4">
    <div className="flex gap-3 justify-center">
      {actions.slice(0, 3).map((action, idx) => (
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
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-medium transition-colors group"
          >
            <span className="text-gray-500 group-hover:text-blue-500 transition-colors">{action.icon}</span>
            {action.label}
          </button>
        )
      ))}
    </div>
    <div className="flex gap-3 justify-center">
      {actions.slice(3).map((action, idx) => (
        action.href ? (
          <Link
            key={3+idx}
            href={action.href}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-medium transition-colors group"
          >
            <span className="text-gray-500 group-hover:text-blue-500 transition-colors">{action.icon}</span>
            {action.label}
          </Link>
        ) : (
          <button
            key={3+idx}
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-medium transition-colors group"
          >
            <span className="text-gray-500 group-hover:text-blue-500 transition-colors">{action.icon}</span>
            {action.label}
          </button>
        )
      ))}
    </div>
  </div>
)}
      </div>


    </>
  );
} 