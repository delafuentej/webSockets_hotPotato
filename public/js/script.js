
////////////////////////////////////////////////
    ////////////// VARIABLES ///////////////////////
    ////////////////////////////////////////////////

//const { CLIENT } = require("./utils/constants");


    //wsClient => will store an instance of the browser’s WebSocket client.
    let wsClient = null; // The client-side WebSocket connection variable: new WebSocket() 
    // clientPlayerIndex => will store a number assigned to a player when the WebSocket server accepts that player into a game (0 through 3).
   let clientPlayerIndex = null;   // The index value of the client: 0 | 1 | 2 | 3
    // potatoHolderIndex => will store the index of the player currently holding the potato 
   let potatoHolderIndex = null;   // The index value of the current holder of the potato: 0 | 1 | 2 | 3
    
    ////////////////////////////////////////////////
    //////////// DOM SETUP /////////////////////////
    ////////////////////////////////////////////////
    
    // Render the four players
    const playerColors = ['blue', 'green', 'pink', 'yellow'];
   const playerElements = [...document.getElementsByClassName('player')];
   // console.log('playerElements',playerElements)
    // make each other player clickable
    //
    playerElements.forEach((playerElement, playerIndex) => {

      //onclick => this function just updates the potatoHolderIndex based on the playerIndex argument.
      //this update only occurs within the one client that passes the potato.This data needs to be sent to the server 
      //so that it may be broadcast out to all other clients.
      playerElement.onclick = function() {
        // Only allow clicks if the game is running, the client is holding the potato, and they didn't click on themselves
        if (clientPlayerIndex === potatoHolderIndex && clientPlayerIndex !== playerIndex ) {  
          // and pass the potato
          passThePotatoTo(playerIndex);
        }
      } 
    });  

    ////////////////////////////////////////////////
    ///////////////// WS LOGIC /////////////////////
    ////////////////////////////////////////////////

    //init()=> contains all logic to initialize the WebSocket client and define its responses to WebSocket events.
    function init() {
      // if a WebSocket connection exists already, close it
      if (wsClient) {
        wsClient.onerror = wsClient.onopen = wsClient.onclose = null;
        wsClient.close();
      }

      // TODO: Create a new WebSocket connection with the server using the ws protocol
      const URL = `ws://localhost:${PORT}`;
      console.log('url', URL)

      wsClient = new WebSocket(URL);



      // TODO: Define the .onopen() handler
        // TODO: Send the server a 'NEW_USER' message

        wsClient.onopen = () => {
          console.log('Connected to the WebSocket server!');

          const customMsg = {
            type: CLIENT.MESSAGE.NEW_USER
          }
          console.log('type',customMsg.type)

          wsClient.send(JSON.stringify(customMsg));
        }

      // TODO: Define the .onmessage() handler
        // For each message type below, call the appropriate helper the proper value
          // 'GAME_FULL' => updateDisplay(displayText);
          // 'PLAYER_ASSIGNMENT' => setPlayerIndex(playerIndex)
          // 'COUNTDOWN' => countDown(clockValue)
          // 'NEW_POTATO_HOLDER' => updateCurrentPotatoHolder(newPotatoHolderIndex)
          // 'GAME_OVER' => endGame()
        wsClient.onmessage = (msgEvent) => {
            const {type, payload } = JSON.parse(msgEvent.data);
            console.log('wsClient',{type, payload});

            switch(type){
                case SERVER.MESSAGE.GAME_FULL:
                  updateDisplay('Session is full!. You have to wait until the next round! :(')
                  break;
                case SERVER.MESSAGE.PLAYER_ASSIGNMENT:
                  setPlayerIndex(payload.clientPlayerIndex);
                  break;
                case SERVER.BROADCAST.NEW_POTATO_HOLDER:
                  updateCurrentPotatoHolder(payload.newPotatoHolderIndex);
                  break;
                case SERVER.BROADCAST.COUNTDOWN:
                  countDown(payload.clockValue);
                  break;
                case SERVER.BROADCAST.GAME_OVER:
                  endGame();
                  break;
                default:
                  break;

            }
        }

      // .onclose is executed when the socket connection is closed
      wsClient.onclose = function(e) {
        updateDisplay('No WebSocket connection');
        wsClient = null;
      }

      // .onerror is executed when error event occurs on the WebSocket connection
      wsClient.onerror = function(e) {
        console.error("WebSocket error observed:", e);
        wsClient = null;
      }
    }


    //passThePotatoTo()=>  updates the current potatoHolderIndex and sends the data to the server.
    // Sets the current potatoHolderIndex ands sends it to the server
    // this function is called whenever the current potato holder clicks 
    //on another player’s avatar (see the .onclick() handlers defined in the DOM SETUP section).
    function passThePotatoTo(newPotatoHolderIndex) { 
      // set the potatoHolderIndex to be the player that was clicked on
      potatoHolderIndex = newPotatoHolderIndex;
      
      // TODO: Send the server a 'PASS_POTATO' message with the newPotatoHolderIndex
      const customMsg = {
        type: CLIENT.MESSAGE.PASS_POTATO,
        payload: { newPotatoHolderIndex }
      };

      wsClient.send(JSON.stringify(customMsg));
      
    }

    const display = document.getElementById('display')

    ////////////////////////////////////////////////
    //////////// DOM HELPER FUNCTIONS //////////////
    ////////////////////////////////////////////////
    function updateDisplay(displayText, backgroundColor) {
      const display = document.getElementById('display');// reference to h1 element
    display.innerHTML = displayText;
    if (backgroundColor) {
      display.style.background = backgroundColor;
    }
  }


  //setPlayerIndex() => assigns each client’s clientPlayerIndex and renders the star next to their avatar.
  // Assigns the client's player index and appends a star to their avatar indicating which player they are.
  function setPlayerIndex(playerIndex) {
    
    clientPlayerIndex = playerIndex;

    // create the star and append the image to the proper player based on the playerIndex
    const img = document.createElement('img');
    img.src = `img/icons/current_player.png`;
    img.className = 'star';
    playerElements[playerIndex].appendChild(img);
  }
  
  //updateCurrentPotatoHolder() => updates the potatoHolderIndex and updates the image of the potato holder.
  // Updates the potatoHolderIndex value and sets each playerAvatar image to either be "HOT" or "COLD" accordingly
  function updateCurrentPotatoHolder(newPotatoHolderIndex) {
    // remove the hasPotato class from any existing elements that have it
    potatoHolderIndex = newPotatoHolderIndex;
    playerElements.forEach((playerElement, i) => {

      const playerAvatar = playerElement.childNodes[0];
      console.log("BeforePassThePotato:", playerAvatar.src);
      console.log('playerAvatar',playerAvatar)
      playerAvatar.src = i === potatoHolderIndex ? playerAvatar.src.replace('cold', 'hot') : playerAvatar.src.replace('hot', 'cold');
      console.log("AfterePassThePotato:", playerAvatar.src);
    })
  }

  //countDown()  => renders the current time with a different color as the clock counts down.
 function countDown(clockValue) {
    let color = '#63fe34a1';
    if (clockValue <= 5) {
      color = '#ff0000b5';
    } else if (clockValue <= 15) {
      color = '#ff7800c7';
    } else if (clockValue <= 25) {
      color = '#ffee00b5';
    }
    updateDisplay(clockValue, color);
  }

 // endGame() => displays a game over message
   function endGame() {
    if (potatoHolderIndex === clientPlayerIndex) {
      updateDisplay('You Lose', '#ff0000b5');
    } else {
      updateDisplay('You Win!', '#63fe34a1');
    }
  }

    // Start the WebSocket server
    init();
