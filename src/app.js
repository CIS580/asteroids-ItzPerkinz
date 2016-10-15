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
