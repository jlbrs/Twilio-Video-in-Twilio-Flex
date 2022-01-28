import { combineReducers } from 'redux';
import { reduce as VideoReducer } from './VideoState';

// Register your redux store under a unique namespace
export const namespace = 'videoSupervisor';

// Combine the reducers
export default combineReducers({
  video: VideoReducer,
});
