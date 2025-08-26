import React from 'react';
import { CheckCircle, Clock, AlertCircle, Save } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  isSaved: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  error: string | null;
  onSaveNow?: () => void;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  isSaved,
  hasUnsavedChanges,
  lastSaved,
  error,
  onSaveNow
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (isSaving) return 'text-blue-600';
    if (isSaved) return 'text-green-600';
    if (hasUnsavedChanges) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (error) return 'Save failed';
    if (isSaving) return 'Saving...';
    if (isSaved) return 'All changes saved';
    if (hasUnsavedChanges) return 'Unsaved changes';
    return 'No changes';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-4 h-4" />;
    if (isSaving) return <Save className="w-4 h-4 animate-spin" />;
    if (isSaved) return <CheckCircle className="w-4 h-4" />;
    if (hasUnsavedChanges) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </div>
      
      {lastSaved && isSaved && (
        <span className="text-gray-500">
          at {formatTime(lastSaved)}
        </span>
      )}
      
      {hasUnsavedChanges && onSaveNow && (
        <button
          onClick={onSaveNow}
          className="text-blue-600 hover:text-blue-800 underline text-xs"
        >
          Save now
        </button>
      )}
      
      {error && (
        <span className="text-red-600 text-xs">
          {error}
        </span>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
