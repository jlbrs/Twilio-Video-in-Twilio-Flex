import React from 'react';
import Video from 'twilio-video';
import { withTheme, withTaskContext, IconButton, Button } from '@twilio/flex-ui';
import { Tooltip } from '@material-ui/core';
import {
  ScreenShareIcon,
  StopScreenShareIcon,
  CameraOnIcon,
  CameraOffIcon,
  ExternalLinkIcon,
} from './VideoIcons';
import reduxConnect from './reduxConnect';

const BACKEND_URL = process.env.REACT_APP_VIDEO_APP_URL;
const VIDEO_APP_URL = process.env.REACT_APP_VIDEO_APP_URL;

const taskContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContext: 'space-between',
  paddingLeft: 0,
  width: '100%',
  borderLeft: '1px solid rgb(198, 202, 215)',
  backgroundColor: 'rgb(251, 251, 252)',
};

const supervisorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContext: 'space-between',
  paddingLeft: 0,
  minWidth: 319,
  borderLeft: '1px solid rgb(198, 202, 215)',
  backgroundColor: 'rgb(251, 251, 252)',
};

const btn = {
  margin: 'auto',
};

const btnContainer = {
  display: 'flex',
  flexGrow: 1,
  justifyContent: 'center',
  margin: '10px 20px',
};

const btnRow = {
  maxHeight: 80,
  display: 'flex',
};

const btnVideoAppRow = {
  marginTop: 'auto',
  paddingLeft: 16,
  paddingBottom: 8,
};

const btnVideoApp = {
  display: 'inline-block',
  verticalAlign: 'middle',
  backgroundColor: 'darkgray',
};

const btnVideoAppIcon = {
  display: 'inline-block',
  verticalAlign: 'middle',
};

class IncomingVideoComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connecting: false,
      activeRoom: null,
      screenTrack: null,
      localAudio: null,
      localVideo: null,
      audioEnabled: true,
      videoEnabled: true
    };
  }

  componentDidMount() {
    console.log("IncomingVideoComponent: componentDidMount");
    if (!this.props.inSupervisor && !this.state.activeRoom && !this.state.connecting) {
      console.log("IncomingVideoComponent: Should connect to Video Room");
      this.connectVideo.bind(this)();
    }
  }

  connectVideo() {
    const task = this.props.selectedTask || this.props.task;
    console.log(task);
    if(task && task.attributes && task.attributes.syncDocument) {
      this.setState({connecting: true});
      const body = {
        DocumentSid: task.attributes.syncDocument,
        Token: this.props.manager.store.getState().flex.session.ssoTokenPayload.token
      };
      const options = {
        method: 'POST',
        body: new URLSearchParams(body),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
      };
      fetch(`${BACKEND_URL}/3-agent-get-token`, options)
        .then((res) => res.json())
        .then((res) => {
          console.log('IncomingVideoComponent: got token: ', res.token);
          return Video.connect(res.token);
        })
        .then(this.roomJoined.bind(this))
        .catch((err) => {
          alert(`Error joining video: ${err.message}`);
        })
        .finally(() => {
          this.setState({connecting: false});
        });
    } else {
      alert(`Error joining video: the incoming task is invalid. Please send a new link to your client.`);
    }
  }

  componentWillUnmount() {
    console.log("IncomingVideoComponent: componentWillUnmount");
    if(this.state.activeRoom) this.disconnect();
  }

  // Attach the Tracks to the DOM.
  attachTracks(tracks, container) {
    tracks.forEach(function (track) {
      if (track.track) track = track.track;
      if (!track.attach) return;
      let trackDom = track.attach();
      trackDom.style.maxWidth = '100%';
      container.appendChild(trackDom);
    });
  }

  attachLocalTracks(tracks, container) {
    if (!this.props.inSupervisor) {
      tracks.forEach(function (track) {
        if (track.track) track = track.track;
        let trackDom = track.attach();
        trackDom.style.maxWidth = '15%';
        trackDom.style.position = 'absolute';
        trackDom.style.top = '60px';
        trackDom.style.left = '10px';
        container.appendChild(trackDom);
      });
    } else {
      tracks.forEach(function (track) {
        if (track.track) track = track.track;
        let trackDom = track.attach();
        trackDom.style.width = '100%';
        trackDom.style['max-height'] = '100px';
        container.appendChild(trackDom);
      });
    }
  }

  // Detach the Tracks from the DOM.
  detachTracks(tracks) {
    tracks.forEach(function (track) {
      if (track.track) track = track.track;
      if (!track.detach) return;
      track.detach().forEach(function (detachedElement) {
        detachedElement.remove();
      });
    });
  }

  roomJoined(room) {
    console.log('IncomingVideoComponent: room joined: ', room);
    this.setState({
      activeRoom: room,
    });
    let remoteMedia = this.refs.remoteMedia;

    // Save the local audio/video tracks in state so we can easily mute later
    Array.from(room.localParticipant.tracks.values()).forEach((track) => {
      if (track.kind === 'audio') {
        this.setState({
          localAudio: track.track,
        });
      } else {
        this.setState({
          localVideo: track.track,
        });
      }
    });

    // add local tracks to the screen
    this.attachLocalTracks(Array.from(room.localParticipant.tracks.values()), remoteMedia);

    room.localParticipant.on("trackEnabled", (track) => {
      console.log("enabled", track);
      if(track === this.state.localAudio) {
        this.setState({audioEnabled: true});
      } else if(track === this.state.localVideo) {
        this.setState({videoEnabled: true});
      }
    })

    room.localParticipant.on("trackDisabled", (track) => {
      console.log("disabled", track);
      if(track === this.state.localAudio) {
        this.setState({audioEnabled: false});
      } else if(track === this.state.localVideo) {
        this.setState({videoEnabled: false});
      }
    })

    // add existing participant tracks
    room.participants.forEach((participant) => {
      console.log(`IncomingVideoComponent: ${participant.identity} is already in the room}`);
      const tracks = Array.from(participant.tracks.values());
      this.attachTracks(tracks, remoteMedia);
    });

    // When a Participant joins the Room
    room.on('participantConnected', (participant) => {
      console.log(`IncomingVideoComponent: ${participant.identity} joined the room}`);
    });

    // when a participant adds a track, attach it
    room.on('trackSubscribed', (track, publication, participant) => {
      console.log(`IncomingVideoComponent: ${participant.identity} added track: ${track.kind}`);
      this.attachTracks([track], remoteMedia);
    });

    // When a Participant removes a Track, detach it from the DOM.
    room.on('trackUnsubscribed', (track, publication, participant) => {
      console.log(`IncomingVideoComponent: ${participant.identity} removed track: ${track.kind}`);
      this.detachTracks([track]);
    });

    // When a Participant leaves the Room
    room.on('participantDisconnected', (participant) => {
      console.log(`IncomingVideoComponent: ${participant.identity} left the room`);
    });

    // Room disconnected
    room.on('disconnected', () => {
      console.log('IncomingVideoComponent: disconnected');
    });
  }

  mute() {
    this.state.localAudio.disable();
  }

  unMute() {
    this.state.localAudio.enable();
  }

  videoOn() {
    this.state.localVideo.enable();
  }

  videoOff() {
    this.state.localVideo.disable();
  }

  disconnect() {
    if(this.state.activeRoom) {
      this.state.activeRoom.disconnect();
      this.props.clearVideo();
      this.setState({
        activeRoom: null,
      });
    }
  }

  getScreenShare() {
    if (navigator.getDisplayMedia) { // supported by Chrome (72+), Firefox (66+), Safari (12.2+)
      return navigator.getDisplayMedia({ video: true });
    } else if (navigator.mediaDevices.getDisplayMedia) {
      return navigator.mediaDevices.getDisplayMedia({ video: true });
    } else {
      return navigator.mediaDevices.getUserMedia({
        video: { mediaSource: 'screen' },
      });
    }
  }

  screenShareOn() {
    this.getScreenShare().then((stream) => {
      let screenTrack = stream.getVideoTracks()[0];
      this.state.activeRoom.localParticipant.publishTrack(screenTrack, { name: `screen-${Date.now()}` });
      this.setState({
        screenTrack: screenTrack
      });
    });
  }

  screenShareOff() {
    this.state.activeRoom.localParticipant.unpublishTrack(this.state.screenTrack);
    this.setState({
      screenTrack: null
    });
  }

  render() {
    let currTask = this.props.selectedTask || this.props.task;
    if (!currTask) return null;
    let containerStyle = this.props.inSupervisor ? supervisorContainerStyle : taskContainerStyle;
    return ( <>
      {this.state.activeRoom ?
          <div style={containerStyle}>
            <div style={btnRow}>
              <div style={btnContainer}>
                <Tooltip title="Disconnect" placement="top">
                  <IconButton icon="CloseLarge" style={btn} onClick={this.disconnect.bind(this)}/>
                </Tooltip>
              </div>
              {this.state.screenTrack && this.state.screenTrack.isEnabled ? (
                <div style={btnContainer}>
                  <Tooltip title="Stop Screenshare" placement="top">
                    <IconButton icon={<StopScreenShareIcon/>} style={btn} onClick={this.screenShareOff.bind(this)}/>
                  </Tooltip>
                </div>
              ) : (
                <div style={btnContainer}>
                  <Tooltip title="Start Screenshare" placement="top">
                    <IconButton icon={<ScreenShareIcon/>} style={btn} onClick={this.screenShareOn.bind(this)}/>
                  </Tooltip>
                </div>
              )}
              {this.state.audioEnabled ? (
                <div style={btnContainer}>
                  <Tooltip title="Mute" placement="top">
                    <IconButton icon="Mute" style={btn} onClick={this.mute.bind(this)}/>
                  </Tooltip>
                </div>
              ) : (
                <div style={btnContainer}>
                  <Tooltip title="Unmute" placement="top">
                    <IconButton icon="MuteBold" style={btn} onClick={this.unMute.bind(this)}/>
                  </Tooltip>
                </div>
              )}
              {this.state.videoEnabled  ? (
                <div style={btnContainer}>
                  <Tooltip title="Stop Camera" placement="top">
                    <IconButton icon={<CameraOnIcon/>} style={btn} onClick={this.videoOff.bind(this)}/>
                  </Tooltip>
                </div>
              ) : (
                <div style={btnContainer}>
                  <Tooltip title="Start Camera" placement="top">
                    <IconButton icon={<CameraOffIcon/>} style={btn} onClick={this.videoOn.bind(this)}/>
                  </Tooltip>
                </div>
              )}
            </div>
            <div ref="remoteMedia" id="remote-media"></div>
            {VIDEO_APP_URL ? (
              <div style={btnVideoAppRow}>
              <Button style={btnVideoApp} onClick={this.openVideoApp}>
              Pop Out
              <ExternalLinkIcon style={btnVideoAppIcon} />
              </Button>
              </div>
              ) : null}
          </div>
          :
        <div style={containerStyle}>
          {this.state.connecting ?
            <p>Connecting...</p>
            :
            <button onClick={this.connectVideo.bind(this)}>Connect</button>
          }
        </div>
        }
      </>
    );
  }
}

export default reduxConnect(withTheme(withTaskContext(IncomingVideoComponent)));
