import type { ExerciseDefinition as ApiExerciseDefinitionMPE } from '@/apis/exerciseDefinitions/types';

export const createDefinitionMapMPE = (defs: ApiExerciseDefinitionMPE[]): Record<string, ApiExerciseDefinitionMPE> => {
    return defs.reduce((acc: Record<string, ApiExerciseDefinitionMPE>, def: ApiExerciseDefinitionMPE) => {
        acc[def._id.toString()] = def;
        return acc;
    }, {});
}; 