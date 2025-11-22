1. Always make the React component mobile first and mobile friendly.
2. Always use Material-UI (MUI) for UI components and styling.

## 🚨 CRITICAL: State Management Rules 🚨

### ⛔ NEVER READ STATE FROM CLOSURE ⛔

**THIS IS THE #1 SOURCE OF BUGS IN THIS CODEBASE!**

#### ❌ WRONG - Reading State from Closure:

```typescript
const MyComponent = () => {
  const [state, setState] = useState({ count: 0, items: [] });
  
  const updateItems = useCallback(async () => {
    const newItems = await fetchItems();
    
    // ❌ WRONG: Reading 'state' from closure - THIS IS STALE!
    setState({
      ...state,           // ❌ STALE STATE FROM CLOSURE!
      items: newItems
    });
  }, []); // 'state' not in dependencies = STALE FOREVER!
  
  return <button onClick={updateItems}>Update</button>;
};
```

**Why this is wrong:**
- `state` is captured in the closure when `useCallback` is created
- If `state` is NOT in the dependency array, it NEVER updates
- You're reading from a **frozen snapshot**, not the **current state**
- Parallel operations will overwrite each other's changes

#### ✅ CORRECT - Reading State from Callback Parameter:

```typescript
const MyComponent = () => {
  const [state, setState] = useState({ count: 0, items: [] });
  
  const updateItems = useCallback(async () => {
    const newItems = await fetchItems();
    
    // ✅ CORRECT: Reading from 'prevState' callback parameter
    setState(prevState => ({
      ...prevState,       // ✅ CURRENT STATE from React!
      items: newItems
    }));
  }, []); // No 'state' dependency needed!
  
  return <button onClick={updateItems}>Update</button>;
};
```

**Why this is correct:**
- `prevState` is passed by React at execution time
- React guarantees `prevState` is the **current state**
- No closure issues - you're reading from the **source of truth**
- Parallel operations are safe - each gets the latest state

### 🔥 The Golden Rules 🔥

**EVERY TIME you write `setState` or `updateState`, ask:**

1. ❓ **Am I reading any state variables outside the setState callback?**
   - If YES → 🚨 **YOU HAVE A BUG!** Use functional update instead!

2. ❓ **Am I using functional update `setState(prev => ...)`?**
   - If NO → 🚨 **YOU WILL HAVE BUGS!** Use functional update!

3. ❓ **Could this function run in parallel with other state updates?**
   - If YES → 🚨 **MUST use functional update or risk race conditions!**

### ⚠️ Common Bug Patterns to AVOID

#### 🐛 Bug Pattern #1: Reading State Before setState

```typescript
// ❌ WRONG
const addItem = async () => {
  const item = await fetch();
  const current = state.items;  // ❌ Reading from closure!
  setState({ items: [...current, item] }); // ❌ Using closure value!
};

// ✅ CORRECT
const addItem = async () => {
  const item = await fetch();
  setState(prev => ({ items: [...prev.items, item] })); // ✅ Read from callback!
};
```

#### 🐛 Bug Pattern #2: Spreading State Object

```typescript
// ❌ WRONG
const update = async () => {
  const data = await fetch();
  setState({ ...state, data }); // ❌ Spreading closure state!
};

// ✅ CORRECT
const update = async () => {
  const data = await fetch();
  setState(prev => ({ ...prev, data })); // ✅ Spreading callback param!
};
```

#### 🐛 Bug Pattern #3: Accessing Nested State

```typescript
// ❌ WRONG
const updateNested = async () => {
  const value = await fetch();
  const current = state.nested.deep.value; // ❌ Closure!
  setState({ 
    nested: { 
      ...state.nested,        // ❌ Closure!
      deep: { 
        ...state.nested.deep, // ❌ Closure!
        value 
      }
    }
  });
};

// ✅ CORRECT
const updateNested = async () => {
  const value = await fetch();
  setState(prev => ({
    nested: {
      ...prev.nested,       // ✅ Callback param!
      deep: {
        ...prev.nested.deep, // ✅ Callback param!
        value
      }
    }
  }));
};
```

#### 🐛 Bug Pattern #4: Parallel Operations

```typescript
// ❌ WRONG - Race condition!
await Promise.all([
  updateA(), // Reads state from closure
  updateB()  // Reads state from closure - will overwrite A's changes!
]);

// ✅ CORRECT - No race condition
await Promise.all([
  updateA(), // Uses setState(prev => ...)
  updateB()  // Uses setState(prev => ...) - sees A's changes!
]);
```

### 📋 Pre-Commit Checklist for State Updates

Before committing ANY code that uses `setState` or `useState`:

- [ ] ✅ I am using functional update: `setState(prevState => ...)`
- [ ] ✅ I am NOT reading state variables outside the setState callback
- [ ] ✅ I am NOT spreading state objects: `{ ...state, ... }`
- [ ] ✅ All state reads happen inside the callback: `prevState.someValue`
- [ ] ✅ If running parallel operations, each uses functional updates
- [ ] ✅ My dependency arrays do NOT include state variables (unless absolutely necessary)

### 🎯 Summary

**ONE SIMPLE RULE TO PREVENT 90% OF BUGS:**

```typescript
// ❌ NEVER DO THIS:
setState({ ...state, newValue })

// ✅ ALWAYS DO THIS:
setState(prev => ({ ...prev, newValue }))
```

**Remember:** `state` is a closure variable that can be stale. `prevState` is a function parameter passed by React that is ALWAYS current!
