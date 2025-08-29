import { useOnboardingContext } from '@/contexts/OnboardingContext';

export const useOnboarding = () => {
  return useOnboardingContext();
};