const ACTION_DISMISS_VIDEO = 'DISMISS_VIDEO';
const ACTION_SHOW_VIDEO = 'SHOW_VIDEO';

const initialState = {
  task: null,
};

export class Actions {
  static showVideo = (task) => ({ type: ACTION_SHOW_VIDEO, task });
  static clearVideo = () => ({ type: ACTION_DISMISS_VIDEO });
}

export function reduce(state = initialState, action) {
  switch (action.type) {
    case ACTION_SHOW_VIDEO: {
      return {
        ...state,
        task: action.task,
      };
    }
    case ACTION_DISMISS_VIDEO: {
      return {
        ...state,
        task: null,
      };
    }

    default:
      return state;
  }
}
