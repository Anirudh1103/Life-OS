import { useState } from 'react';

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  return {
    isLoading,
    setIsLoading,
  };
}
