import { useState } from 'react';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const openOnboarding = () => setShowOnboarding(true);
  const closeOnboarding = () => setShowOnboarding(false);
  
  return { showOnboarding, openOnboarding, closeOnboarding };
};