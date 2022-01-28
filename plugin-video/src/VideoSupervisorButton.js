import React from 'react';
import { Button, withTheme, withTaskContext } from '@twilio/flex-ui';
import reduxConnect from './reduxConnect';

const btn = {
  backgroundColor: 'darkgray',
};

class VideoSupervisorButton extends React.Component {
  handleClick() {
    this.props.showVideo(this.props.task);
  }

  render() {
    return (
      <Button style={btn} onClick={this.handleClick.bind(this)} {...this.props}>
        Join Video
      </Button>
    );
  }
}

export default reduxConnect(withTheme(withTaskContext(VideoSupervisorButton)));
