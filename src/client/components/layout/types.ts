import { ReactNode } from 'react';

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  requiresAuth?: boolean;
}

export interface NavigatorStandalone {
  standalone?: boolean;
}
