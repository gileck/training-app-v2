import { NavItem } from './layout/types';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import { Book, WorkOutline, FitnessCenter, List, ListAltSharp } from '@mui/icons-material';

export const navItems: NavItem[] = [
  { path: '/', label: 'Workout', icon: <FitnessCenter /> },
  {
    path: '/training-plans',
    label: 'Training Plans',
    icon: <ListAltSharp />
  },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export const menuItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <HomeIcon /> },
  {
    path: '/training-plans',
    label: 'Training Plans',
    icon: <ListAltSharp />
  },
  {
    path: '/workout-page',
    label: 'Workout',
    icon: <WorkOutline />
  },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];
