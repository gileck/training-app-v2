## 1. High-Level Solution

Add a new "AI Assistant" tab to the Manage Training Plan page that provides a chat interface. The user types requests like "add a shoulder exercise to my plan" and the assistant proposes structured actions (e.g., add exercise X). The user must confirm each proposed action before it is applied. Applying actions uses the same existing training plan APIs used by `ExercisesTab.tsx` and `WorkoutsTab.tsx` to get/add/remove/edit exercises and workouts.

End-to-end flow:
- User opens the Training Plan page and selects the new "AI Assistant" tab.
- User types a natural-language request.
- The assistant resolves intent and entities (exercise/workout) and returns one or more ProposedActions with a human-readable explanation.
- The tab presents each ProposedAction with a Confirm button. Nothing mutates until confirmed.
- On confirm, the client calls the existing Exercises/Workouts APIs to apply the change, then refreshes UI state.

### Design Decisions (v1)
- Disambiguation UX: present a list to pick from when multiple matches exist.
- Confidence thresholds: ask for clarification when confidence is below threshold.
- Existing AI chat reuse: do not reuse; purpose-built component for plan editing.
- Action batching: support "Confirm All" to apply all proposed actions at once.
- Workout defaults: ask the user (e.g., prompt for workout name) before confirming.
- Edit granularity: changes are per-exercise (not per-set for v1).
- Permissions: no extra permissions beyond current plan editing.
- Logging/privacy: none for v1.
- i18n: none for v1.
- Auto-suggest: off; only respond to user prompts.

## 2. Implementation Details

Follow the app API/component patterns (see `src/apis/apis.ts`, `src/client/components`, and `src/client/routes`). The AI assistant will not mutate data on the server; it only proposes actions. Confirmed actions are executed on the client by calling existing APIs already used in `ExercisesTab.tsx` and `WorkoutsTab.tsx`.

- Target files
  - New: `src/client/routes/ManageTrainingPlanPage/components/AIChatTab.tsx`
    - Chat UI, message list, input, rendering ProposedActions, confirm buttons.
    - Integrates with training plan hooks to execute confirmed actions.
  - Edit: `src/client/routes/ManageTrainingPlanPage/ManageTrainingPlanPage.tsx`
    - Add a new tab labeled "AI Assistant" wired to `AIChatTab`.
  - New: `src/client/components/AIActionConfirmDialog.tsx`
    - A reusable MUI dialog to display the action summary and ask for confirmation.
  - New: `src/client/routes/ManageTrainingPlanPage/hooks/useAiAssistant.ts`
    - Encapsulate chat messages, API calls, action proposals, and execution wiring to existing hooks.
  - New: `src/client/routes/ManageTrainingPlanPage/hooks/useAiAssistantActions.ts`
    - Dedicated, direct actions for AI flow (no UI dialogs). Methods: `addExerciseToPlan`, `removeExerciseFromPlan`, `updateExerciseInPlan`, `createWorkout`, `deleteWorkout`, `renameWorkout`, etc. Internally call the same APIs as `ExercisesTab.tsx`/`WorkoutsTab.tsx` but without user dialogs.
  - New API module: `src/apis/trainingPlanAiAssistant/`
    - `index.ts`: export names and wire into `src/apis/apis.ts`.
    - `types.ts`: shared types for assistant requests and structured ProposedActions.
    - `server.ts`: business logic—use existing AI infra to parse intent & entities; return ProposedActions only.
    - `client.ts`: typed client returning `CacheResult<ResponseType>` per guidelines.
  - Edit: `src/apis/apis.ts`
    - Register the new API endpoint/handler using the standard pattern.
  - Tests: `tests/e2e/ai-assistant-training-plan.spec.ts`
    - Covers propose + confirm + apply for add exercise and add workout. Also covers ambiguous query confirmation.

- Types and payloads
  - `ProposedAction` (union) representing non-destructive suggestions:
    - addExerciseToPlan
    - removeExerciseFromPlan
    - editExerciseInPlan (e.g., sets/reps)
    - addWorkoutToPlan
    - removeWorkoutFromPlan
    - renameWorkout
  - Each includes a human-readable `summary`, `confidence`, and a `payload` with all IDs needed by existing APIs.

- Key logic
  - Entity resolution and disambiguation: Server returns multiple candidate actions when ambiguous; UI renders a pick list. Below confidence threshold, assistant asks for clarification.
  - Server-side AI only: Follow `ai-models-api-usage` (adapter pattern, caching, model validation, cost tracking, non-throwing error fields).
  - Safety: Server returns proposals only; mutation happens on client after explicit confirm or confirm-all.
  - Defaults: Workout names and other missing details are collected from the user before confirmation.
  - Observability: Optionally record assistant usage via existing AI usage monitoring.

- Example code sketches (non-final, illustrative):

```ts
// src/apis/trainingPlanAiAssistant/types.ts
export type AssistantMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type AddExerciseAction = {
  type: 'addExerciseToPlan';
  payload: {
    planId: string;
    exerciseDefinitionId: string;
    // Optional defaults; client may enrich/edit before confirming
    sets?: number;
    reps?: number;
  };
  summary: string;
  confidence: number; // 0..1
};

export type ProposedAction =
  | AddExerciseAction
  | { type: 'removeExerciseFromPlan'; payload: { planId: string; exerciseId: string }; summary: string; confidence: number }
  | { type: 'editExerciseInPlan'; payload: { planId: string; exerciseId: string; updates: Record<string, unknown> }; summary: string; confidence: number }
  | { type: 'addWorkoutToPlan'; payload: { planId: string; name?: string }; summary: string; confidence: number }
  | { type: 'removeWorkoutFromPlan'; payload: { planId: string; workoutId: string }; summary: string; confidence: number }
  | { type: 'renameWorkout'; payload: { planId: string; workoutId: string; newName: string }; summary: string; confidence: number };

export interface SuggestActionsRequest {
  planId: string;
  messages: AssistantMessage[];
  modelId: string; // required per ai-models-api-usage
}

export interface SuggestActionsResponse {
  actions: ProposedAction[];
  assistantMessages: AssistantMessage[]; // optional assistant replies for chat transcript
  clarificationNeeded?: boolean; // true if confidence too low and user input is required
  error?: string; // non-throwing error field per guidelines
  cost: { totalCost: number; [k: string]: number }; // cost tracking per ai guidelines
}
```

```ts
// src/apis/trainingPlanAiAssistant/server.ts (sketch)
import { getExerciseDefinitions } from '@/apis/exerciseDefinitions/server';
import { type SuggestActionsRequest, type SuggestActionsResponse } from './types';
import { AIModelAdapter } from '@/server/ai/baseModelAdapter';
import { isModelExists } from '@/server/ai/models';

export async function suggestActions(req: SuggestActionsRequest): Promise<SuggestActionsResponse> {
  try {
    if (!isModelExists(req.modelId)) {
      return { actions: [], assistantMessages: [], clarificationNeeded: false, error: `Invalid model ID: ${req.modelId}`, cost: { totalCost: 0 } };
    }
    const definitions = await getExerciseDefinitions();
    const adapter = new AIModelAdapter(req.modelId);
    const { result, cost } = await adapter.processPromptToJSON<SuggestActionsResponse>({
      systemPrompt: 'Return only valid JSON matching SuggestActionsResponse.',
      userMessages: req.messages,
      context: { definitions },
    });
    const safe = sanitizeAndValidate(result, definitions);
    return { ...safe, cost };
  } catch (e) {
    return { actions: [], assistantMessages: [], clarificationNeeded: false, error: `AI service error: ${e instanceof Error ? e.message : String(e)}`, cost: { totalCost: 0 } };
  }
}
```

```ts
// src/apis/trainingPlanAiAssistant/client.ts (sketch)
import { type CacheResult } from '@/common/cache/types';
import { apiFetch } from '@/apis/processApiCall';
import { type SuggestActionsRequest, type SuggestActionsResponse } from './types';

export async function suggestActionsForTrainingPlan(req: SuggestActionsRequest): Promise<CacheResult<SuggestActionsResponse>> {
  return apiFetch('/api/trainingPlanAiAssistant/suggestActions', req);
}
```

```tsx
// src/client/routes/ManageTrainingPlanPage/components/AIChatTab.tsx (sketch)
import React from 'react';
import { Box, Stack, TextField, Button } from '@mui/material';
import { suggestActionsForTrainingPlan } from '@/apis/trainingPlanAiAssistant/client';
import { useAiAssistantActions } from '../hooks/useAiAssistantActions';

export const AIChatTab: React.FC<{ planId: string }> = ({ planId }) => {
  const [messages, setMessages] = React.useState([]);
  const [proposedActions, setProposedActions] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [modelId] = React.useState('default-model'); // later allow user selection via models.ts

  const aiActions = useAiAssistantActions({ planId });

  async function onSend() {
    const userMessage = { role: 'user', content: input };
    const res = await suggestActionsForTrainingPlan({ planId, messages: [...messages, userMessage], modelId });
    if (res.success) {
      setMessages([...messages, userMessage, ...(res.data.assistantMessages ?? [])]);
      setProposedActions(res.data.actions);
    }
    setInput('');
  }

  const actionHandlers = {
    addExerciseToPlan: (payload) => aiActions.addExerciseToPlan(payload),
    removeExerciseFromPlan: (payload) => aiActions.removeExerciseFromPlan(payload),
    editExerciseInPlan: (payload) => aiActions.updateExerciseInPlan(payload),
    addWorkoutToPlan: (payload) => aiActions.createWorkout(payload),
    removeWorkoutFromPlan: (payload) => aiActions.deleteWorkout(payload),
    renameWorkout: (payload) => aiActions.renameWorkout(payload),
  } as const;

  async function onConfirm(action) {
    const handler = actionHandlers[action.type];
    if (handler) {
      await handler(action.payload);
    }
  }

  return (
    <Box>
      <Stack spacing={2}>
        {/* messages & proposed actions UI */}
        <Box>
          <TextField value={input} onChange={(e) => setInput(e.target.value)} fullWidth placeholder="Ask the assistant..." />
          <Button onClick={onSend} variant="contained" sx={{ mt: 1 }}>Send</Button>
          {proposedActions.length > 0 && (
            <Button onClick={async () => { for (const a of proposedActions) await onConfirm(a); }} variant="outlined" sx={{ mt: 1, ml: 1 }}>Confirm All</Button>
          )}
        </Box>
      </Stack>
    </Box>
  );
};
```

```tsx
// src/client/components/AIActionConfirmDialog.tsx (sketch)
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export const AIActionConfirmDialog: React.FC<{ open: boolean; summary: string; onConfirm: () => void; onClose: () => void }>
  = ({ open, summary, onConfirm, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirm Action</DialogTitle>
    <DialogContent>{summary}</DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color="primary">Confirm</Button>
    </DialogActions>
  </Dialog>
);
```

- Registration
  - Add the new API to `src/apis/apis.ts` with a handler name exported only in the module `index.ts` and re-exported server-side. Ensure the client imports names from `index.ts` only and returns `CacheResult<ResponseType>`.

- Execution mapping (client-side)
  - Implement a mapping function from `ProposedAction` to dedicated AI action hooks in `useAiAssistantActions` (no user dialogs):
    - `addExerciseToPlan` → `aiActions.addExerciseToPlan({ exerciseDefinitionId, defaults })`.
    - `removeExerciseFromPlan` → `aiActions.removeExerciseFromPlan({ exerciseId })`.
    - `editExerciseInPlan` → `aiActions.updateExerciseInPlan({ exerciseId, updates })`.
    - `addWorkoutToPlan` → `aiActions.createWorkout({ name })`.
    - `removeWorkoutFromPlan` → `aiActions.deleteWorkout({ workoutId })`.
    - `renameWorkout` → `aiActions.renameWorkout({ workoutId, newName })`.

## 3. Implementation Phases

- Phase 1: API scaffolding
  - Create `trainingPlanAiAssistant` API module with types, server logic stub, and client. Register in `apis.ts`.

- Phase 2: Client scaffolding
  - Build `AIChatTab.tsx` with minimal chat UI and wire `useAiAssistant` hook. Add the new tab to the page.

- Phase 3: Entity resolution & proposals
  - Implement server intent parsing and entity resolution for common operations (add/remove/edit exercise; add/remove/rename workout). Return `ProposedAction[]`.

- Phase 4: Confirmation & execution
  - Add `AIActionConfirmDialog`. Map proposals to existing hooks and ensure state refresh.

- Phase 5: Testing
  - Add e2e tests for proposal + confirmation flows, including ambiguous queries.

- Phase 6: Polish
  - Error/loading states, optimistic UI where safe, usage metrics, empty states, a11y.

## 4. Potential Issues

- Hallucinations or invalid IDs from the model. Mitigation: server validates IDs and only returns safe ProposedActions; return `clarificationNeeded` when unsure.
- Race conditions with concurrent plan edits. Mitigation: rely on existing hooks’ error handling and reload after apply.
- Rate limits/cost. Mitigation: adapter caching and user feedback on failures; track cost in response.
- Accessibility: Ensure keyboard navigation and ARIA for chat and confirmation controls.

## 5. Task List

Mark tasks as [✅] when completed. Update this list as progress is made.

- [✅] Task 1: Scaffold `trainingPlanAiAssistant` API (index/types/server/client)
- [✅] Task 2: Register API in `src/apis/apis.ts` per guidelines
- [✅] Task 3: Create `AIChatTab.tsx` and wire to hooks
- [✅] Task 4: Add "AI Assistant" tab to Manage Training Plan page
- [ ] Task 5: Implement intent parsing, thresholds, and disambiguation on the server
- [ ] Task 6a: Implement action mapping and "Confirm All"
- [ ] Task 6b: Add confirmation dialog UI and wire confirmations
- [ ] Task 7: Prompt for workout name when missing before confirm
- [ ] Task 8: Add error/loading states and UX polish
- [ ] Task 9: Write e2e tests (propose + disambiguate + confirm + apply)
- [ ] Task 10: Update documentation (README/feature plan status)

References
- APIs pattern: `src/apis/apis.ts`
- Components pattern: `src/client/components`
- Routes pattern: `src/client/routes`
- DB/collections pattern: `src/server/database/collections`

