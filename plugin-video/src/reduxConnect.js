import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Actions as VideoActions } from './VideoState';

export default function connectComponent(component) {
  const mapStateToProps = (state) => {
    return {
      selectedTask:
        (state.videoSupervisor &&
          state.videoSupervisor.video &&
          state.videoSupervisor.video.task) ||
        null,
    };
  };

  const mapDispatchToProps = (dispatch) => ({
    showVideo: bindActionCreators(VideoActions.showVideo, dispatch),
    clearVideo: bindActionCreators(VideoActions.clearVideo, dispatch),
  });

  return connect(mapStateToProps, mapDispatchToProps)(component);
}
