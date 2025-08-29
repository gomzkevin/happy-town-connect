import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  icon: string;
  features?: string[];
  duration?: string;
  max_participants?: number;
  age_range?: string;
  space_requirements?: string;
}

export interface SelectedService {
  service: Service;
  quantity: number;
}

interface ServicesContextType {
  selectedServices: SelectedService[];
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearSelection: () => void;
  getTotalPrice: () => number;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  const addService = (service: Service) => {
    setSelectedServices(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) {
        return prev.map(item =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(item => item.service.id !== serviceId));
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }
    setSelectedServices(prev =>
      prev.map(item =>
        item.service.id === serviceId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearSelection = () => {
    setSelectedServices([]);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, item) => {
      const price = parseInt(item.service.price.replace(/[^\d]/g, ''));
      return total + (price * item.quantity);
    }, 0);
  };

  return (
    <ServicesContext.Provider value={{
      selectedServices,
      addService,
      removeService,
      updateQuantity,
      clearSelection,
      getTotalPrice
    }}>
      {children}
    </ServicesContext.Provider>
  );
};