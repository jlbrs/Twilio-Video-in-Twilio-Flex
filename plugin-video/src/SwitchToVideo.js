import React from 'react';
import { Icon, withTaskContext } from '@twilio/flex-ui';
import { CameraOnIcon } from './VideoIcons';

const buttonStyle = {
  padding: '0px 16px',
  border: 'none',
  background: '#ccc',
  outline: 'none',
  alignSelf: 'center',
  height: '28px',
  marginLeft: '1em',
  fontSize: '10px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  whiteSpace: 'nowrap',
  borderRadius: '100px',
  color: 'rgb(255, 255, 255)'
};
class SwitchToVideo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loading: false};
  }

  onClick() {
    this.setState({loading: true});
    fetch(`${process.env.REACT_APP_VIDEO_APP_URL}/1-generate-unique-code`)
      .then((response) => response.json())
      .then((response) => {
        console.log('SwitchToVideo: unique link created:', response);
        return this.props.flex.Actions.invokeAction("SendMessage", { body: `Please join me using this unique video link: ${response.full_url}`, channelSid: this.props.task.attributes.channelSid });
      })
      .finally(() => {
        this.setState({loading: false});
      })
  }

  render() {
    return (
      <>
        {
          (this.props.task.channelType === 'web' || this.props.task.channelType === 'sms' || this.props.task.channelType === "whatsapp") && (
            <button className="Twilio-Button" style={buttonStyle} onClick={this.onClick.bind(this)} disabled={this.state.loading}>
              {this.state.loading?<Icon icon="Loading"/>:<CameraOnIcon/>}
            </button>
          )
        }
      </>
    );
  }
}

export default withTaskContext(SwitchToVideo);
