import React from 'react';
import { Brain, Zap, Check } from 'lucide-react';

/**
 * Intelligence Mode Toggle Component
 * Allows users to switch between Normal and Max intelligence modes
 */
export default function IntelligenceModeToggle({ 
  currentMode, 
  onModeChange, 
  isLoading = false,
  saveStatus = 'idle'
}) {
  const modes = [
    {
      id: 'auto',
      label: 'Auto',
      description: 'Smart mode that automatically chooses the best model for each task.',
      icon: Zap,
      color: 'bg-green-500',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      model: 'either model',
      credits: '1-3 credits per request'
    },
    {
      id: 'normal',
      label: 'Normal',
      description: 'Faster generation with good quality. Perfect for quick content creation.',
      icon: Brain,
      color: 'bg-blue-500',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      model: 'gpt-4o-mini',
      credits: '1 credit per request'
    },
    {
      id: 'max',
      label: 'MAX',
      description: 'Slower but higher quality. Best for premium content and complex analysis.',
      icon: Zap,
      color: 'bg-purple-500',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      model: 'gpt-4o',
      credits: '3 credits per request'
    }
  ];

  const handleModeSelect = (modeId) => {
    if (!isLoading && modeId !== currentMode) {
      onModeChange(modeId);
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        );
      case 'saved':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <div className="w-4 h-4 bg-red-500 rounded-full" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Intelligence Mode</h3>
          <p className="text-sm text-gray-600">Choose the quality of the content</p>
        </div>
        {getSaveStatusIcon()}
      </div>

      <div className="space-y-3">
        {modes.map((mode) => {
          const IconComponent = mode.icon;
          const isSelected = currentMode === mode.id;
          const isDisabled = isLoading;

          return (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              disabled={isDisabled}
              className={`
                w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? `${mode.borderColor} ${mode.color} text-white shadow-md` 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-white/20' : 'bg-white shadow-sm'}
                `}>
                  <IconComponent className={`w-5 h-5 ${isSelected ? 'text-white' : mode.textColor}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {mode.label}
                    </h4>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-600'} mb-2`}>
                    {mode.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className={`flex items-center gap-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      <span className="font-mono bg-black/10 px-1.5 py-0.5 rounded">
                        {mode.model}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      <span>{mode.credits}</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            Loading settings...
          </p>
        </div>
      )}
    </div>
  );
} 