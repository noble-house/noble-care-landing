import { useState, useEffect, useCallback, useRef } from 'react';

interface AutoSaveOptions {
  delay?: number; // Debounce delay in milliseconds
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface AutoSaveState {
  isSaving: boolean;
  isSaved: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

export const useAutoSave = <T>(
  data: T,
  options: AutoSaveOptions = {}
) => {
  const {
    delay = 2000, // 2 seconds default
    onSave,
    onError,
    enabled = true
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    isSaved: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T>(data);

  // Debounced save function
  const debouncedSave = useCallback(async (currentData: T) => {
    if (!enabled || !onSave) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      await onSave(currentData);
      setState(prev => ({
        ...prev,
        isSaving: false,
        isSaved: true,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setState(prev => ({
        ...prev,
        isSaving: false,
        isSaved: false,
        error: errorMessage
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [enabled, onSave, onError]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !onSave) return;

    // Check if data has actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    
    if (hasChanged) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true, isSaved: false }));
      lastDataRef.current = data;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        debouncedSave(data);
      }, delay);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, onSave, debouncedSave]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await debouncedSave(data);
  }, [data, debouncedSave]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isSaving: false,
      isSaved: false,
      lastSaved: null,
      hasUnsavedChanges: false,
      error: null
    });
    lastDataRef.current = data;
  }, [data]);

  return {
    ...state,
    saveNow,
    reset
  };
};
