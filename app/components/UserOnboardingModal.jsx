import { useState, useEffect } from 'react';
import { X, ChevronRight, Check, Sparkles, User, Target, Building, Briefcase, Star, Clock, Users } from 'lucide-react';

const questions = [
  {
    key: 'interests',
    label: 'What are your main interests?',
    placeholder: 'e.g. marketing, memes, AI',
    type: 'text',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'This helps us suggest relevant content and features'
  },
  {
    key: 'goals',
    label: 'What is your main goal using this app?',
    placeholder: 'e.g. Grow my TikTok following',
    type: 'text',
    icon: <Target className="w-5 h-5" />,
    description: 'We\'ll tailor your experience to help you achieve this'
  },
  {
    key: 'role',
    label: 'What is your role?',
    placeholder: 'e.g. Founder, Marketer, Creator',
    type: 'text',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'This helps us customize your dashboard and tools'
  },
  {
    key: 'experienceLevel',
    label: 'What is your experience level?',
    type: 'select',
    icon: <Star className="w-5 h-5" />,
    description: 'We\'ll adjust the complexity of features accordingly',
    options: ['Beginner', 'Intermediate', 'Expert'],
  },
  {
    key: 'timeCommitment',
    label: 'How much time can you dedicate weekly?',
    type: 'select',
    icon: <Clock className="w-5 h-5" />,
    description: 'This helps us suggest realistic content creation schedules',
    options: ['1-2 hours', '3-5 hours', '5-10 hours', '10+ hours'],
  },
  {
    key: 'targetAudience',
    label: 'Who is your target audience?',
    placeholder: 'e.g. young professionals, small business owners',
    type: 'text',
    icon: <Users className="w-5 h-5" />,
    description: 'This helps us tailor content suggestions and AI prompts'
  },
];

export default function UserOnboardingModal({ open, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [show, setShow] = useState(open);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setShow(open);
    if (open) {
      setStep(0);
      setAnswers({});
      setIsAnimating(false);
    }
  }, [open]);

  const handleChange = (e) => {
    setAnswers({ ...answers, [questions[step].key]: e.target.value });
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      setShow(false);
      if (onComplete) onComplete(answers);
    }
  };

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && answers[questions[step].key]) {
      handleNext();
    }
  };

  if (!show) return null;

  const q = questions[step];
  const isLastStep = step === questions.length - 1;

  // Safety check to prevent undefined access
  if (!q) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-auto relative">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 relative">
          <button 
            onClick={handleClose} 
            className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 text-center pr-8">Personalize Your Experience</h2>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
            {/* Question header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0">
                {q.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{q.label}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{q.description}</p>
              </div>
            </div>

            {/* Input field */}
            <div className="mb-8">
              {q.type === 'text' && (
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
                  placeholder={q.placeholder}
                  value={answers[q.key] || ''}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
              )}
              {q.type === 'select' && (
                <select
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all duration-200 text-gray-900 bg-white text-base"
                  value={answers[q.key] || ''}
                  onChange={handleChange}
                >
                  <option value="">Select an option...</option>
                  {q.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === step ? 'bg-orange-500' : 
                      index < step ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <button
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
                  answers[q.key] 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleNext}
                disabled={!answers[q.key]}
              >
                {isLastStep ? (
                  <>
                    <Check className="w-5 h-5" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 