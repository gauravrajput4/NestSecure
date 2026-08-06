import { configureStore } from '@reduxjs/toolkit';
import navigationReducer from './navigationSlice.js';

// Central Redux store. Currently holds the navigation history stack that powers
// the custom back/forward controls; add future slices here.
export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
  },
});

export default store;
