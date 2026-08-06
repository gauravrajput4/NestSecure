import { createSlice } from '@reduxjs/toolkit';

// Browser-history-style navigation stack managed in Redux. Powers the custom
// back/forward buttons in the Navbar so they behave like a browser's own
// controls: visiting a new page truncates any forward history, while back and
// forward simply move a pointer along the recorded stack.
//
// The stack starts empty; the first route the app renders seeds entry 0 (this
// avoids a phantom "/" entry when the user deep-links straight to, say, a PG
// detail page).
const initialState = {
  stack: [], // paths visited, oldest → newest
  index: -1, // pointer to the current entry in `stack` (-1 = nothing yet)
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    // A fresh navigation to `path`. Drops any forward entries (like a browser),
    // then appends the new path and points at it. No-ops on a duplicate of the
    // current entry so repeated links don't stack up, and so back/forward button
    // nav that triggers location.onChange doesn't corrupt the stack.
    visit: (state, action) => {
      const path = action.payload;
      // Already at this path? Nothing to do (prevents back/forward re-dispatch).
      if (state.stack[state.index] === path) return;
      // First visit seeds entry 0.
      if (state.index === -1) {
        state.stack = [path];
        state.index = 0;
        return;
      }
      // Drop forward history, append path, move pointer.
      state.stack = state.stack.slice(0, state.index + 1);
      state.stack.push(path);
      state.index = state.stack.length - 1;
    },
    // Move the pointer one step toward the start of the stack.
    goBack: (state) => {
      if (state.index > 0) state.index -= 1;
    },
    // Move the pointer one step toward the end of the stack.
    goForward: (state) => {
      if (state.index < state.stack.length - 1) state.index += 1;
    },
  },
});

export const { visit, goBack, goForward } = navigationSlice.actions;

// Selectors
export const selectCanGoBack = (state) => state.navigation.index > 0;
export const selectCanGoForward = (state) =>
  state.navigation.index < state.navigation.stack.length - 1;
export const selectStack = (state) => state.navigation.stack;
export const selectIndex = (state) => state.navigation.index;

export default navigationSlice.reducer;
