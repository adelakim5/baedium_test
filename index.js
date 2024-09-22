import env from "dotenv"
import { WebClient } from "@slack/web-api";
import pkg from "@slack/bolt";

env.config()

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const { App, ExpressReceiver } = pkg;

// Create an ExpressReceiver for Slack to use Express
const receiver = new ExpressReceiver({
  signingSecret: SLACK_SIGNING_SECRET,
});

const slackApp = new App({
  token: SLACK_TOKEN,
  receiver,  // Use the custom ExpressReceiver
});
const slackClient = new WebClient(SLACK_TOKEN);
const channel = SLACK_CHANNEL_ID;

const app = receiver.app;  // Express app provided by ExpressReceiver
const port = 3000;

// Handle Slack's URL verification event in Express manually
app.post('/slack/events', (req, res) => {
    const body = req.body;

    // URL 검증만 처리
    if (body.type === 'url_verification') {
        res.status(200).send(body.challenge);
    } else {
        // URL 검증이 아닌 이벤트는 Bolt 앱이 처리하도록 둡니다.
        res.status(200).send('Event received');
    }
});

// Handle GET request for test purposes
app.get('/', async (req, res) => {  
  try {
    await slackClient.chat.postMessage({
      channel: channel,  // Send message to a specific channel
      text: 'Hello, world! This is a custom notification.',
    });
    res.send('Message sent to specific channel!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to send message');
  }
});

// Bolt 앱에서 app_home_opened 이벤트 처리
slackApp.event('app_home_opened', async ({ event, client }) => {
  try {
    await client.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Welcome to your Home Tab!'
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'This is a section block with *bold* text.'
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error(error);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});