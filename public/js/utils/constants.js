//where the various message types used in this application are defined
const PORT = 8080;
 const MAX_TIME = 30;
 const CLIENT = {
  MESSAGE: {
    //NEW_USER => is sent from the client to the server when the client joins the server
    NEW_USER: 'NEW_USER',
    //PASS_POTATO =>  is sent from the client to the server when the client passes the potato to another player.
    PASS_POTATO: 'PASS_POTATO'
  }
}
 const SERVER = {
  MESSAGE: {
    //PLAYER_ASSIGNMENT => is sent from the server to a single client when the client joins the server
    PLAYER_ASSIGNMENT: 'PLAYER_ASSIGNMENT',
    //GAME_FULL => is sent from the server to a single client when they attempt to join a full game
    GAME_FULL: 'GAME_FULL'
  },
  BROADCAST: {
    //COUNTDOWN => is broadcast to all clients each time the timer ticks ('tic-tac')
    COUNTDOWN: 'COUNTDOWN',
    //NEW_POTATO_HOLDER => is broadcast to all clients when the potato is passed
    NEW_POTATO_HOLDER: 'NEW_POTATO_HOLDER',
    //GAME_OVER => is broadcast to all clients when the game ends (the timer reaches 0)
    GAME_OVER: 'GAME_OVER'
  }
};

// This check allows the module to be used in the client and the server
if (typeof module !== "undefined" && module.exports) {
  module.exports = exports = {
    PORT,
    MAX_TIME,
    CLIENT, 
    SERVER
  }
}