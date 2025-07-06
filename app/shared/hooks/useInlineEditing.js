'use client';

import { useState, useCallback } from 'react';

export function useInlineEditing() {
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const startEditing = useCallback((textId, initialValue) => {
    setEditingTextId(textId);
    setEditingValue(initialValue);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingTextId(null);
    setEditingValue('');
  }, []);

  const updateEditingValue = useCallback((value) => {
    setEditingValue(value);
  }, []);

  return {
    editingTextId,
    editingValue,
    startEditing,
    stopEditing,
    updateEditingValue
  };
} 