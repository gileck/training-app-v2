import { DefaultWorkoutView } from './DefaultUI';
import { ModernWorkoutView } from './ModernUI';
import { IOSStyleWorkoutView } from './IOSStyleUI';
import { NeonDarkWorkoutView } from './DarkModeUI';
import { NeonLightWorkoutView } from './LightModeUI';
import { MinimalistWorkoutView } from './MinimalistUI';
import { RetroWorkoutView } from './RetroUI';

export const UI_VARIANTS = [
    {
        id: 'default',
        name: 'Default UI',
        component: DefaultWorkoutView
    },
    {
        id: 'modern',
        name: 'Modern UI',
        component: ModernWorkoutView
    },
    {
        id: 'ios',
        name: 'iOS Style',
        component: IOSStyleWorkoutView
    },
    {
        id: 'neon-dark',
        name: 'Neon Dark',
        component: NeonDarkWorkoutView
    },
    {
        id: 'neon-light',
        name: 'Neon Light',
        component: NeonLightWorkoutView
    },
    {
        id: 'minimal',
        name: 'Minimalist',
        component: MinimalistWorkoutView
    },
    {
        id: 'retro',
        name: 'Retro Gaming',
        component: RetroWorkoutView
    }
];

export * from './types'; 