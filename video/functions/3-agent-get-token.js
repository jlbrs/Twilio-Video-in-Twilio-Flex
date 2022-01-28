const AccessToken = require('twilio').jwt.AccessToken;
const {SyncGrant, VideoGrant} = AccessToken;
const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = TokenValidator(async function (context, event, callback) {
  // This block will only be called if your token is validated, otherwise it returns a 403.
  const client = context.getTwilioClient();

  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');

  // Check that the document_sid was provided (provided to the agent as a Task attribute)
  const {DocumentSid: document_sid} = event;
  if (!document_sid) {
    response.setStatusCode(500);
    response.setBody({error: `Missing document SID.`})
    return callback(null, response);
  }

  // Check that the document_sid provided exists and load it.
  const document = await client.sync.services(context.SYNC_SERVICE_SID)
    .documents(document_sid)
    .fetch()
    .catch((reason) => null);

  if (!document) {
    response.setStatusCode(403);
    response.setBody({error: `Invalid document SID.`})
    console.log(response);
    return callback(null, response);
  }

  // Check if the video room is already created
  let room_name = document.data.room;
  if (!room_name)  {
    // If not, then create it
    const room_created = await client.video.rooms
      .create({
        recordParticipantsOnConnect: context.VIDEO_RECORD_BY_DEFAULT,
        type: context.VIDEO_ROOM_TYPE,
        statusCallback: `https://${context.DOMAIN_NAME}/callback/video-room?document=${document.sid}` // Will be used to update the SYNC document if/when the room is deleted.
      })
      .then(room => {
        room_name = room.sid;
        console.log(document.sid, room.sid);
        return {...document.data, room: room.sid};
      })
      .then(new_document_data => client.sync.services(context.SYNC_SERVICE_SID)
        .documents(document.sid)
        .update({data: new_document_data})
      )
      .catch(reason => false)

    if (!room_created) {
      response.setStatusCode(503);
      response.setBody({error: `Error starting video.`})
      return callback(null, response);
    }
  }

  // We use the agent's FLEX identity
  const agent_identity = event.TokenResult.identity;

  // We give the agent read-only rights to the SYNC document
  // Note: not used today, but here just to show what it would look like!
  client.sync.services(context.SYNC_SERVICE_SID)
    .documents(document_sid)
    .documentPermissions(agent_identity)
    .update({read: true, write: false, manage: false})
    .then(document_permission => console.log(document_permission.serviceSid));

  // Authorize the agent Frontend to connect to SYNC
  // Note: not used today, but here just to show what it would look like!
  const syncGrant = new SyncGrant({
    serviceSid: context.SYNC_SERVICE_SID
  });

  // Authorize the agent Frontend to connect to VIDEO
  const videoGrant = new VideoGrant({
    room: room_name,
  });

  // Create an access token which we will sign and return to the agent,
  const token = new AccessToken(
    context.ACCOUNT_SID,
    context.TWILIO_API_KEY,
    context.TWILIO_API_SECRET,
    {identity: agent_identity}
  );
  token.addGrant(syncGrant);
  token.addGrant(videoGrant);

  // Respond to the AGENT frontend with a dual-use token (sync + video)
  response.setBody({token: token.toJwt()});
  return callback(null, response);
});
