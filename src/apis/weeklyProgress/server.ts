import { addWeeklyNote } from './handlers/addWeeklyNote';
import { deleteWeeklyNote } from './handlers/deleteWeeklyNote';
import { editWeeklyNote } from './handlers/editWeeklyNote';
import { getWeeklyProgress } from './handlers/getWeeklyProgress';
import { updateSetCompletion } from './handlers/updateSetCompletion';

// Export all APIs for weekly progress
export {
    addWeeklyNote,
    deleteWeeklyNote,
    editWeeklyNote,
    getWeeklyProgress,
    updateSetCompletion
};

// Also re-export the API names for registration in apis.ts
export {
    nameGet as getWeeklyProgressApiName,
    nameUpdateSet as updateSetCompletionApiName,
    nameAddNote as addWeeklyNoteApiName,
    nameEditNote as editWeeklyNoteApiName,
    nameDeleteNote as deleteWeeklyNoteApiName
} from './index'; 