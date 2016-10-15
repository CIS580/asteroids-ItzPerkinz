(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict;"

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');
const Asteroid = require('./asteroid.js');
const Laser = require('./laser.js');

/* Global variables */
var canvas = document.getElementById('screen');                                 // the canvas
var game = new Game(canvas, update, render);                                    // the game object
var player = new Player({x: canvas.width/2, y: canvas.height/2}, canvas);       // the player
var bground = new Image();                                                      // the background image (space)
bground.src = "assets/space_background.png";
var level = 1;                                                                  // the level that the player is on
var score = 0;                                                                  // the player's score
var asteroids = new Array();                                                    // list of asteroids on the screen
var lasers = new Array();                                                       // list of lasers on the screen
var timer = 1000;
var potentiallyColliding = new Array();

function initLevel()
{
  // create asteroids on the top/bot of the screen
  for (var i = 0; i < Math.floor((9 + level) / 2); i++) {
    var randX = Math.random()*canvas.width;                                     // chooses a random x value
    var side = Math.floor(Math.random()*2);                                     // decides top or bot
    var position = {x: randX, y: 950*side};                                     // creates the position to pass into asteroid
    var ang = Math.random()*360;                                                // creates the random angle
    var size = Math.floor(Math.random()*4 + 1);                                 // determines the size
    var newAstX = new Asteroid(position, canvas, size, ang);
    asteroids.push(newAstX);
  }
  // create asteroids on the right/left of the screen
  for (var i = Math.floor((9 + level)/2); i < 9 + level; i++) {
    var randY = Math.random()*canvas.height;                                    // chooses a random y value
    var side = Math.floor(Math.random()*2);                                     // decides right or left
    var position = {x: 650*side, y: randY};                                     // creates the position to pass into asteroid
    var ang = Math.random()*360;                                                // creates the random angle
    var size = Math.floor(Math.random()*4 + 1);                                 // determines the size
    var newAstY = new Asteroid(position, canvas, 4, ang);
    asteroids.push(newAstY);
  }
}

initLevel();

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  player.update(elapsedTime);
  timer += elapsedTime;
  for (var i = 0; i < asteroids.length; i++) {
    asteroids[i].update(elapsedTime);
    checkForCollisions(asteroids[i]);
  }
  for (var i = 0; i < lasers.length; i++) {
    if (lasers[i].onScreen == false) remove(lasers, lasers[i]);
    if (lasers[i] != null) lasers[i].update(elapsedTime);
  }
  //console.log(lasers.length);
  // TODO: Update the game objects

}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.drawImage(bground,0,0); // background image
  player.render(elapsedTime, ctx); // render player
  for (var i = 0; i < asteroids.length; i++) {
    asteroids[i].render(elapsedTime, ctx);
  }
  for (var i = 0; i < lasers.length; i++)
  {
    lasers[i].render(elapsedTime, ctx);
  }

  // level and score
  ctx.fillStyle = "White";
  ctx.font = "15px Impact";
  ctx.fillText("Level : " + level, 10, 20);
  ctx.fillText("Score : " + score, 10, 40);
}

window.onkeypress = function(event) {
  switch (event.keyCode)
  {
    case 32:
    if(timer > 300) {
      console.log("Space");
      var laz = new Laser(player.position, player.angle);
      lasers.push(laz);
      timer = 0;
    }
    break;
  }
}

function remove(array, x)
{
  var index;
  for (var i = 0; i < array.length; i++)
  {
    if (array[i] == x) index = i;
  }
  var temp = array[0];
  array[0] = array[index];
  array[index] = temp;
  array.shift();
}

function checkForCollisions(ast)
{
  // finds potentially colliding asteroids so that i do not have to run sqrt and pow commands a large number of times
  findPotentials(ast);
  // asteroid hits another asteroid
  for (var p = 0; p < potentiallyColliding.length; p++) {
    var closest = potentiallyColliding[p];
    var distance = Math.sqrt( Math.pow((closest.position.x - ast.position.x), 2) + Math.pow((closest.position.y - ast.position.y), 2));       // distance formula
    if (distance < (ast.radius + closest.radius))
    {
      ast.state = "collision";
      closest.state = "collision";
    }
  }

  // asteroid is shot with laser
  for (var i = 0; i < lasers.length; i++)
  {
    var laz = lasers[i];
    var distance = Math.sqrt( Math.pow(((laz.position.x - 15*(laz.velocity.x)) - ast.position.x), 2) + Math.pow(((laz.position.y - 15*(laz.velocity.y)) - ast.position.y), 2));
    var distance2 = Math.sqrt( Math.pow(((laz.position.x - ast.position.x), 2)) + Math.pow((laz.position.y - ast.position.y), 2));
    if (distance < ast.radius || distance2 < ast.radius)
    {
      laz.onScreen = false;
      score += ast.type;
      ast.state = "collision";
    }
  }
  var distance2 = Math.sqrt( Math.pow((player.position.x - ast.position.x), 2) + Math.pow((player.position.y - ast.position.y), 2));

  // asteroid collides with player
  if (distance2 < (ast.radius + 6))
  {
    ast.state = "collision";
  }
  potentiallyColliding = new Array();
}

// finds asteroids that are potentially colliding with the given asteroid.
function findPotentials(a)
{
  for (var i = 0; i < asteroids.length; i++) {
    if (asteroids[i].position.x - a.position.x < 60 || a.position.x - asteroids[i].position.x < 60) {
      if (asteroids[i].position.y - a.position.y < 60 || a.position.y - asteroids[i].position.y < 60) {
        if (asteroids[i] != a) {
          potentiallyColliding.push(asteroids[i]);
        }
      }
     }
  }
}

},{"./asteroid.js":2,"./game.js":3,"./laser.js":4,"./player.js":5}],2:[function(require,module,exports){
"use strict"

module.exports = exports = Asteroid;

var sizes = [11, 16, 23, 32];
var speeds = []

function Asteroid(position, canvas, size, angle)
{
  this.worldWidth = canvas.width;
  this.worldHeight = canvas.height;
  this.state = "moving";
  this.position = {
    x: position.x,
    y: position.y
  };
  this.angle = angle;
  this.speed = Math.random() * 3 + 1;
  this.velocity = {
    x: Math.cos(this.angle),
    y: Math.sin(this.angle)
  };
  this.type = size;
  this.size = sizes[size];
  this.radius = Math.pow(2, size+1);
  this.ke = this.size*this.speed;
}

Asteroid.prototype.update = function(time)
{
  switch(this.state) {
    case "moving":
    // move asteroid based on angle (which gives us velocity vectors)
    this.position.x += this.velocity.x / this.type;
    this.position.y -= this.velocity.y / this.type;

    // wrap around screen
    if(this.position.x < 0) this.position.x += this.worldWidth;
    if(this.position.x > this.worldWidth) this.position.x -= this.worldWidth;
    if(this.position.y < 0) this.position.y += this.worldHeight;
    if(this.position.y > this.worldHeight) this.position.y -= this.worldHeight;
    break;

    case "collision":

    break;
  }
}

Asteroid.prototype.render = function(time, ctx)
{
  // draws a white circle for the asteroid
  ctx.fillStyle = "Grey";
  if (this.state == "collision") ctx.fillStyle = "Red";
  ctx.beginPath();
  ctx.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI);
  ctx.closePath();
  ctx.fill();
  }

Asteroid.prototype.collide = function(other)
{

}

},{}],3:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],4:[function(require,module,exports){
"use strict"

module.exports = exports = Laser;

function Laser(position, angle)
{
  this.position = {
    x: position.x,
    y: position.y
  }
  this.angle = angle;
  this.velocity = {
    x: Math.sin(this.angle),
    y: Math.cos(this.angle)
  };
  this.state = "moving";
  this.onScreen = true;
}

Laser.prototype.update = function(time)
{
  switch (this.state) {
    case "moving":
    // move the laser
    this.position.x -= 15*(this.velocity.x);
    this.position.y -= 15*(this.velocity.y);

    //disappear if it goes off screen
    if(this.position.x < 0) this.onScreen = false;
    if(this.position.x > this.worldWidth) this.onScreen = false;
    if(this.position.y < 0) this.onScreen = false;
    if(this.position.y > this.worldHeight) this.onScreen = false;

    break;
  }
}

Laser.prototype.render = function(time, ctx)
{
  // Draw a red line for the laser
  ctx.strokeStyle = "Red";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(this.position.x, this.position.y);
  ctx.lineTo(this.position.x - 15*(this.velocity.x), this.position.y - 15*(this.velocity.y));
  ctx.stroke();
  ctx.lineWidth = 1;
}

},{}],5:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/8;

/**
 * @module exports the Player class
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a new player object
 * @param {Postition} position object specifying an x and y
 */
function Player(position, canvas) {
  this.worldWidth = canvas.width;
  this.worldHeight = canvas.height;
  this.state = "idle";
  this.position = {
    x: position.x,
    y: position.y
  };
  this.velocity = {
    x: 0,
    y: 0
  }
  this.angle = 0;
  this.radius  = 64;
  this.thrusting = false;
  this.steerLeft = false;
  this.steerRight = false;

  var self = this;
  window.onkeydown = function(event) {
    switch(event.key) {
      case 'ArrowUp': // up
      case 'w':
        self.thrusting = true;
        break;
      case 'ArrowLeft': // left
      case 'a':
        self.steerLeft = true;
        break;
      case 'ArrowRight': // right
      case 'd':
        self.steerRight = true;
        break;
    }
  }


  window.onkeyup = function(event) {
    switch(event.key) {
      case 'ArrowUp': // up
      case 'w':
        self.thrusting = false;
        break;
      case 'ArrowLeft': // left
      case 'a':
        self.steerLeft = false;
        break;
      case 'ArrowRight': // right
      case 'd':
        self.steerRight = false;
        break;
    }
  }

}



/**
 * @function updates the player object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Player.prototype.update = function(time) {
  // Apply angular velocity
  if(this.steerLeft) {
    this.angle += time * 0.005;
  }
  if(this.steerRight) {
    this.angle -= 0.1;
  }
  // Apply acceleration
  if(this.thrusting) {
    var acceleration = {
      x: Math.sin(this.angle),
      y: Math.cos(this.angle)
    }
    this.velocity.x -= acceleration.x /4;
    this.velocity.y -= acceleration.y /4;
  }
  // Apply velocity
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;
  // Wrap around the screen
  if(this.position.x < 0) this.position.x += this.worldWidth;
  if(this.position.x > this.worldWidth) this.position.x -= this.worldWidth;
  if(this.position.y < 0) this.position.y += this.worldHeight;
  if(this.position.y > this.worldHeight) this.position.y -= this.worldHeight;
}

/**
 * @function renders the player into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Player.prototype.render = function(time, ctx) {
  ctx.save();

  // Draw player's ship
  ctx.translate(this.position.x, this.position.y);
  ctx.rotate(-this.angle);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(-10, 10);
  ctx.lineTo(0, 0);
  ctx.lineTo(10, 10);
  ctx.closePath();
  ctx.strokeStyle = 'white';
  ctx.stroke();

  // Draw engine thrust
  if(this.thrusting) {
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(5, 10);
    ctx.arc(0, 10, 5, 0, Math.PI, true);
    ctx.closePath();
    ctx.strokeStyle = 'orange';
    ctx.stroke();
  }
  ctx.restore();

  //ctx.fillText(this.angle, this.position.x, this.position.y);
}

},{}]},{},[1]);
