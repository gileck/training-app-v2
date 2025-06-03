import { NavItem } from './layout/types';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import { Book, WorkOutline, FitnessCenter } from '@mui/icons-material';

export const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <HomeIcon /> },
  {
    path: '/training-plans',
    label: 'Training Plans',
    icon: <Book />
  },
  {
    path: '/workout-page',
    label: 'Workout',
    icon: <WorkOutline />
  },
  {
    path: '/saved-workouts',
    label: 'Saved Workouts',
    icon: <FitnessCenter />
  }
];

export const menuItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <HomeIcon /> },
  {
    path: '/training-plans',
    label: 'Training Plans',
    icon: <Book />
  },
  {
    path: '/workout-page',
    label: 'Workout',
    icon: <WorkOutline />
  },
  {
    path: '/saved-workouts',
    label: 'Saved Workouts',
    icon: <FitnessCenter />
  },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];
