import { useContext } from 'react';
import { ContentContext } from './contentContextValue';

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
