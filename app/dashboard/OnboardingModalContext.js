import { createContext, useContext } from 'react';

export const OnboardingModalContext = createContext();

export function useOnboardingModal() {
  return useContext(OnboardingModalContext);
} 