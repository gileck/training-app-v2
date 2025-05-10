import { NavItem } from './layout/types';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import InsightsIcon from '@mui/icons-material/Insights';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import BarChartIcon from '@mui/icons-material/BarChart';
export const navItems: NavItem[] = [
  { path: '/workout', label: 'Workout', icon: <PlayCircleFilledIcon />, requiresAuth: true },
  { path: '/training-plans', label: 'Training Plans', icon: <FitnessCenterIcon />, requiresAuth: true }
];

export const menuItems: NavItem[] = [
  { path: '/ai-chat', label: 'AI Chat', icon: <ChatIcon /> },
  { path: '/training-plans', label: 'Training Plans', icon: <FitnessCenterIcon />, requiresAuth: true },
  { path: '/file-manager', label: 'Files', icon: <FolderIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  { path: '/ai-monitoring', label: 'AI Monitoring', icon: <InsightsIcon /> },
  { path: '/manage-workouts', label: 'Manage Workouts', icon: <FolderIcon /> },
  { path: '/progress-view', label: 'Progress View', icon: <BarChartIcon /> },
];
