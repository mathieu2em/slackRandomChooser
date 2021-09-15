// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// The base view for the home page.
var homeBase = [{
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*Welcome to the Slack Random Chooser !!! yeah * :tada: \n" +
                "Select the channel from which you want to select users randomly to talk during the scrum."
              }
            },
            {
              "type": "divider"
            }];

// The base view for the random chooser page.
var randomChooserViewBase = [{
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "click on the button to randomly select the next person to talk!"  }
            },
            {
              "type": "divider"
            },
                             
                             {
              "type": "actions",
              "elements": [{
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "text": "Next!" 
                  },
                  "action_id":"chooseADev",
                  
              }]}];

var everybodyTalkedView = [{
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "everybody talked!! Congratulations!!"  } 
            },
            {
              "type": "divider"
            },
            {
              "type": "image",
              "title": {
                "type": "plain_text",
                "text": "congratz!",
                "emoji": true
              },
              "image_url": "https://www.lollydaskal.com/wp-content/uploads/2018/01/celebrating-success-picture-id541976048.jpeg",
              "alt_text": "happy team"
                           },
                           {
              "type": "actions",
              "elements": [{
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "text": "finish" 
                  },
                  "action_id":"reset",
                  
              }]}];
// Used to enable app actions initialization.
var firstTime = false;

var globalMembersList = [];
var index = 0;

// Start the app.
(async (client) => {
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');  
})();

// When a user open the app home page.
app.event('app_home_opened', async ({ event, client, context }) => {
  
  if(firstTime == false){
    
    firstTime = true;

    var blocks = homeBase;

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
            
            var members = await client.conversations.members({channel : channel.id})

            startRandomChooser(members.members, client, event);
            
            console.log("test");


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
      const result = await client.views.publish({

        /* the user that opened your app's app home */
        user_id: event.user,

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
  }
});

async function startRandomChooser(membersList, client, event){
  
  var membersListAsString = "";
  
  var users = await client.users.list();
  var members = users.members;
  var channelMembers = members.filter(member =>  membersList.includes(member.id) && !member.is_bot)
  
  // Initialize the global variable containing the members list.
  channelMembers.forEach(member => {
    membersListAsString += member.real_name + ", ";
    globalMembersList.push(member);
  });
  
  // Reset view for the random chooser
  var view1 = {
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
              "type": "actions",
              "elements": [{
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "choose a dev." 
          },
          "action_id":"chooseADev",
          "value": membersListAsString
          },
                           {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Back" 
          },
          "action_id":"reset"
          }
                           ]
            }
        ]
      };
  
  try {
  
  /* view.publish is the method that your app uses to push a view to the Home tab */
      const result = await client.views.publish({

        /* the user that opened your app's app home */
        user_id: event.user,

        /* the view object that appears in the app home*/
        view: view1
      });
  } catch (error) {
    console.log(error);
  }
  
  
  app.action('chooseADev',async ({ack, body, client}) => {
    ack();

    try {
      
      if(globalMembersList.length==0){
        everybodyTalked(ack, body, client);
      } else {

        let randomChooserView = randomChooserViewBase.slice();
        
        let randomInt = Math.floor(Math.random()*globalMembersList.length);
        
        let member = globalMembersList[randomInt];
        
        var memberView = genMemberView(member);
        
        // TODO add the list of members still to talk.
        /*
        var membersLeft = "";
        
        globalMembersList.forEach(member => {
          membersLeft += member.real_name;
        });
        
        membersLeftView = genMembersLeftView()
        */
        randomChooserView.push(memberView);
        
        globalMembersList.splice(randomInt, 1);

        await client.views.update({
          // Pass the view_id
          view_id: body.view.id,
          // Pass the current hash to avoid race conditions
          hash: body.view.hash,
          view: {
            type: 'home',
            callback_id: 'home_view',

            /* body of the view */
            blocks: randomChooserView
          }    
        })
      }
    } catch (error) {
      console.log(error);
    }
  });
  
  
}

// Resets every global variable of the app and return to first home view.
app.action('reset', async ({ack, body, client}) => {
  resetApp(ack, body, client);
});

async function resetApp(ack, body, client) {
  ack();
  
  firstTime = true;
  globalMembersList = [];
  index = 0;
  
  try {
    await client.views.update({
      // Pass the view_id
      view_id: body.view.id,
      // Pass the current hash to avoid race conditions
      hash: body.view.hash,

      view: {
            type: 'home',
            callback_id: 'home_view',

            /* body of the view */
            blocks: homeBase
          }
    });
  } catch (error) {
    console.log(error);
  }
}

async function everybodyTalked(ack, body, client) {
  ack();
  
  await client.views.update({
    // Pass the view_id
    view_id: body.view.id,
    // Pass the current hash to avoid race conditions
    hash: body.view.hash,
    
    view: {
          type: 'home',
          callback_id: 'home_view',

          /* body of the view */
          blocks: everybodyTalkedView
        } 
  });
}

function genMemberView(member){
  
  var memberView = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": member.real_name
			},
			"accessory": {
				"type": "image",
				"image_url": member.profile.image_512,
        "alt_text": "the user image"
			}
		}
  
  return memberView;
}