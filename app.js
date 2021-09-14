// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});



// All the room in the world for your code



(async (client) => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
  
})();

app.event('app_home_opened', async ({ event, client, context }) => {
  
  var blocks = [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Welcome to the Slack Random Chooser !!! yeahyeah * :tada: \n" +
              "This app is still in development, but at term, the goal is to do the same thing as the random chooser application inside slack."
            }
          },
          {
            "type": "divider"
          }
  ];
  
  try {
    
    // List channels
    var conversations = await client.conversations.list();
    var channels = conversations.channels;
    
    // create a button for every channel
    var buttons = [];
    
    channels.forEach(channel => {
      
      buttons.push({
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": channel.name 
        },
        "action_id":channel.id
      });
      
      app.action(channel.id, async ({ack, body, client}) => {
        ack();

        try{

          var test = {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": channel.name
                  }
                };

          blocks.push(test);
          
          await client.views.update({
            // Pass the view_id
            view_id: body.view.id,
            // Pass the current hash to avoid race conditions
            hash: body.view.hash,

            /* the view object that appears in the app home*/
            view: {
              type: 'home',
              callback_id: 'home_view',

              /* body of the view */
              blocks: blocks
            }
          });


        } catch(error){
          console.log(error);
        }

      });
      
      
      
    });
    
    
    var buttonsLayout = {
            "type": "actions",
            "elements": buttons
          };
    blocks.push(buttonsLayout);
    
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.update({

      /* the user that opened your app's app home */
      user_id: event.user,
      // Pass the view_id
      view_id: client.view.id,
      // Pass the current hash to avoid race conditions
      hash: client.view.hash,


      /* the view object that appears in the app home*/
      view: {
        type: 'home',
        callback_id: 'home_view',

        /* body of the view */
        blocks: blocks
      }
    });
  }
  catch (error) {
    console.error(error);
  }
});

async function startRandomChooser(membersList){
  
  var membersListAsString = "";
  
  membersList.forEach(member => {
    membersListAsString += member.name + ","
  })
  
  // Reset view for the random chooser
  var view = {
        type: 'home',
        callback_id: 'home_view',

        /* body of the view */
        blocks: [{
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "the members of this channel are : " + membersListAsString       
            }
          },
          {
            "type": "divider"
          },{
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "choose a dev." 
          },
          "action_id":"chooseADev",
          "value": membersListAsString
          }
        ]
      }
  
  app.action('chooseADev',async ({ack, body, client, value}) => {
    console.log("value is" + value);
  })
  
  
}