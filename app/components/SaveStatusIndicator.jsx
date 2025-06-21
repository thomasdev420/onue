import { Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function SaveStatusIndicator({ saveStatus }) {
  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Save size={16} className="animate-spin text-blue-500" />;
      case 'saved':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  };

  if (saveStatus === 'idle') return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md">
      {getSaveStatusIcon()}
      <span className="text-sm text-gray-600">{getSaveStatusText()}</span>
    </div>
  );
} 