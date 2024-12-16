///////////////////////////////////////////////
///////////// IMPORTS + VARIABLES /////////////
///////////////////////////////////////////////

const CONSTANTS = require('./public/js/utils/constants');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocket, WebSocketServer} = require('ws');

// Constants
const { PORT, MAX_TIME, CLIENT, SERVER } = CONSTANTS;

// Application Variables;

// nextPlayerIndex => is used to provide the clientPlayerIndex for the next player to join
// and can be used to keep track of the number of players in the game.
let nextPlayerIndex = 0;

///////////////////////////////////////////////
///////////// HTTP SERVER LOGIC ///////////////
///////////////////////////////////////////////

// Create the HTTP server
const server = http.createServer((req, res) => {
  // get the file path from req.url, or '/public/index.html' if req.url is '/'
  //const filePath = ( req.url === '/' ) ? '/public/index.html' : req.url;

   // Define the base directory for public files
   const publicDir = path.join(__dirname, 'public');

    // Get the file path from req.url, defaulting to '/index.html' if req.url is '/'
  const filePath = req.url === '/' ? path.join(publicDir, 'index.html') : path.join(publicDir, req.url);


  // determine the contentType by the file extension
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  if (extname === '.js') contentType = 'text/javascript';
  else if (extname === '.css') contentType = 'text/css';

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // If the file doesn't exist, return a 404 response
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

  // pipe the proper file to the res object
//   res.writeHead(200, { 'Content-Type': contentType });
//   fs.createReadStream(`${__dirname}/${filePath}`, 'utf8').pipe(res);
// });

res.writeHead(200, { 'Content-Type': contentType });
fs.createReadStream(filePath).pipe(res).on('error', (err) => {
  // Handle file read errors
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('500 Internal Server Error');
});
});
});

///////////////////////////////////////////////
////////////////// WS LOGIC ///////////////////
///////////////////////////////////////////////

// TODO: Create the WebSocket Server (ws) using the HTTP server

const wsServer = new WebSocketServer({server});

// TODO: Define the websocket server 'connection' handler
// TODO: Define the socket 'message' handler
  // 'NEW_USER' => handleNewUser(socket)
  // 'PASS_POTATO' => passThePotatoTo(newPotatoHolderIndex)

  wsServer.on('connection', (ws)=>{
    console.log('A new client has joined the server');

    ws.on('message', (data)=>{
      console.log('data',data);
      const { type, payload } = JSON.parse(data);
      console.log({type, payload})

      switch(type) {
        case CLIENT.MESSAGE.NEW_USER:
          handleNewUser(ws);
          break;
        case CLIENT.MESSAGE.PASS_POTATO:
          passThePotatoTo(payload.newPotatoHolderIndex);
          break;
        default:
          break;
      }
    })
  })


///////////////////////////////////////////////
////////////// HELPER FUNCTIONS ///////////////
///////////////////////////////////////////////

// TODO: Implement the broadcast pattern

//Note: We will be broadcasting our messages to ALL connected clients. 
//Accordingly, the wsToOmit parameter will largely not be used however, 
//it is a good practice to include it in your implementation to reinforce the pattern.

//broadcast pattern => is needed to passing the potato
function broadcast(data, wsToOmit){
  //Iterate through the complete list of its connected clients:
  wsServer.clients.forEach((connectedClient)=>{
    //For each connectedClient:
    //- Check if the connectedClient still has an open ready state
    //- Check if the connectedClient is not the same socket as socketToOmit
    if((connectedClient.readyState === WebSocket.OPEN) && connectedClient !== wsToOmit){
      //If both of these checks pass: send the data to the connectedClient
        connectedClient.send(JSON.stringify(data));
    }
  })
}

//handleNewUser() =>  determines WHAT TO DO when a new player joins the server. 
//Until there are 4 players in the game, the server will accept a new client into 
//the game by sending them a clientPlayerIndex value. Once there are 4 players in the game, 
//a random player will be assigned to hold the potato and the game will start. If there are 4
// or more players in the game, the server will let them know that the game is full.
function handleNewUser(ws) {
  // Until there are 4 players in the game....
  if (nextPlayerIndex < 4) {
    // TODO: Send PLAYER_ASSIGNMENT to the socket with a clientPlayerIndex
    const msg = {
      type: SERVER.MESSAGE.PLAYER_ASSIGNMENT,
      payload: { clientPlayerIndex: nextPlayerIndex }
    }
    ws.send(JSON.stringify(msg));
    
    // Then, increment the number of players in the game
    nextPlayerIndex++;
    
    // If they are the 4th player, start the game
    if (nextPlayerIndex === 4) {
      // Choose a random potato holder to start
      const randomFirstPotatoHolder = Math.floor(Math.random() * 4);
      passThePotatoTo(randomFirstPotatoHolder);
      
      // Start the timer
      startTimer();
    }
  } 
  
  // If 4 players are already in the game...
  else {
    // TODO: Send GAME_FULL to the socket
    const msg = {
      type: SERVER.MESSAGE.GAME_FULL,
     
    };
    ws.send(JSON.stringify(msg));

  }
}


//passPotatoTo() => should broadcast to all clients the newPotatoHolderIndex
// when a player passes the potato.
// this function will be called each time the potato changes hands:
    //- once, when the game begins
    // - while the game is running

function passThePotatoTo(newPotatoHolderIndex) {
  // TODO: Broadcast a NEW_POTATO_HOLDER message with the newPotatoHolderIndex

  const data = {
    type: SERVER.BROADCAST.NEW_POTATO_HOLDER,
    payload:  { newPotatoHolderIndex }
  }
    broadcast(data);
  
};

//startTimer() => starts a timer interval that “ticks” every 1 second from 30 down to 0.
// It should broadcast the current time to each client connected to the server and notify 
// all players when the game is over.

function startTimer() {
  // Set the clock to start at MAX_TIME (30)
  let clockValue = MAX_TIME;
  
  // Start the clock ticking
  const interval = setInterval(() => {
    //if the timer is still running
    if (clockValue > 0) {
      // TODO: broadcast 'COUNTDOWN' with the clockValu
      //it should broadcast the new time to all players
      broadcast({
        type: SERVER.BROADCAST.COUNTDOWN,
        payload: { clockValue }
      })

      // decrement until the clockValue reaches 0
      clockValue--;
    }

    // If time has run out => At 0...
    else {
      clearInterval(interval); // stop the timer
      nextPlayerIndex = 0; // reset the players index to 0
      
      // TODO: Broadcast 'GAME_OVER'
      broadcast({
        type: SERVER.BROADCAST.GAME_OVER,
      });
    }
  }, 1000);
}

// Start the server listening on localhost:8080
server.listen(PORT, () => {
  console.log(server.address())
  console.log(`Listening on: http://localhost:${server.address().port}`);
});
