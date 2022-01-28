import { FlexPlugin } from 'flex-plugin';
import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import reducers, { namespace } from './States';
import IncomingVideoComponent from './IncomingVideoComponent';
import VideoSupervisorButton from './VideoSupervisorButton';
import SwitchToVideo from './SwitchToVideo';

const PLUGIN_NAME = 'VideoPlugin';

export default class VideoPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {
    this.registerReducers(manager);

    // Video is not a default channel, so we need to register a new one.
    flex.TaskChannels.register({
      name: "video",
      isApplicable: (task) => task.taskChannelUniqueName === process.env.REACT_APP_VIDEO_TASK_CHANNEL_UNIQUE_NAME,
      icons: {
        list: 'Video',
        main: 'Video',
        active: 'Video',
      },
      capabilities: new Set(["Video"]),
      addedComponents: [{
        target: 'TaskCanvasTabs',
        options: {
          sortOrder: 0,
          align: 'start',
          if: (props) => props.task.status === "accepted"
        },
        component: (
          <IncomingVideoComponent
            manager={manager}
            icon="Video"
            iconActive="Video"
            key="IncomingVideoComponent"
          />
        ),
      }],
    }, true);

    // add the Agent "switch to video" button
    flex.TaskCanvasHeader.Content.add(<SwitchToVideo key="video" flex={flex} />,);

    // add the Supervisor "join video" buttons
    flex.Supervisor.TaskOverviewCanvas.Content.add(
      <VideoSupervisorButton key="video-supervisor-button" />,
      { sortOrder: 0, if: (props) => props.task && props.task.taskChannelUniqueName === process.env.REACT_APP_VIDEO_TASK_CHANNEL_UNIQUE_NAME },
    );
    flex.TeamsView.Content.add(
      <IncomingVideoComponent
        key="video-supervisor-canvas"
        manager={manager}
        inSupervisor={true}
      />,
    );

    console.log(`FLEX TOKEN IS: ### ${manager.user.token} ###`);
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(
        `You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`,
      );
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
