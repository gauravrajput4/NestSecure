import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { visit } from '../store/navigationSlice.js';

// Records every route change into the Redux navigation stack. Rendered once,
// high in the tree, under both <Provider> and <BrowserRouter>. The `visit`
// reducer de-dupes, so back/forward navigation (which also changes the location)
// won't corrupt the stack — it simply no-ops when the pointer already matches.
export default function NavigationTracker() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(visit(location.pathname + location.search));
  }, [location.pathname, location.search, dispatch]);

  return null;
}
