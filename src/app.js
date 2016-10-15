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
var lives = 3;
var immuneTimer = 0;
var gameOver = false;

// window.onkeypress just randomly stopped working for me halfway through the project so i had to move these outside of the player class so that i could handle lasers as well.
window.onkeydown = function(event) {
  event.preventDefault()
  if (event.keyCode == 32)
  {
    if(timer > 300 && player.immune == false) {
      var laz = new Laser(player.position, player.angle + (90 * 0.0174533));
      lasers.push(laz);
      timer = 0;
    }
  }
  switch(event.key) {
    case 'ArrowUp': // up
    case 'w':
      player.thrusting = true;
      break;
    case 'ArrowLeft': // left
    case 'a':
      player.steerLeft = true;
      break;
    case 'ArrowRight': // right
    case 'd':
      player.steerRight = true;
      break;
  }
}

window.onkeyup = function(event) {
  event.preventDefault()
  switch(event.key) {
    case 'ArrowUp': // up
    case 'w':
      player.thrusting = false;
      break;
    case 'ArrowLeft': // left
    case 'a':
      player.steerLeft = false;
      break;
    case 'ArrowRight': // right
    case 'd':
      player.steerRight = false;
      break;
  }
}

function initLevel()
{
  // create asteroids on the top/bot of the screen
  for (var i = 0; i < Math.floor((9 + level) / 2); i++) {
    var randX = Math.random()*canvas.width;                                     // chooses a random x value
    var side = Math.floor(Math.random()*2);                                     // decides top or bot
    var position = {x: randX, y: 950*side};                                     // creates the position to pass into asteroid
    var ang = Math.random()*360 * 0.0174533;                                    // creates the random angle in radians
    var size = Math.floor(Math.random()*4);                                     // determines the size
    var newAstX = new Asteroid(position, canvas, size, ang);
    asteroids.push(newAstX);
  }
  // create asteroids on the right/left of the screen
  for (var i = Math.floor((9 + level)/2); i < 9 + level; i++) {
    var randY = Math.random()*canvas.height;                                    // chooses a random y value
    var side = Math.floor(Math.random()*2);                                     // decides right or left
    var position = {x: 650*side, y: randY};                                     // creates the position to pass into asteroid
    var ang = Math.random()*360 * 0.0174533;                                    // creates the random angle in radians
    var size = Math.floor(Math.random()*4);                                     // determines the size
    var newAstY = new Asteroid(position, canvas, size, ang);
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
  if (!gameOver)
  {
    player.update(elapsedTime);
    timer += elapsedTime;
    immuneTimer += elapsedTime;
    if (immuneTimer >= 3000) player.immune = false;
    for (var i = 0; i < asteroids.length; i++) {
      asteroids[i].update(elapsedTime);
      checkForCollisions(asteroids[i]);
    }
    for (var i = 0; i < lasers.length; i++) {
      if (lasers[i].onScreen == false) remove(lasers, lasers[i]);
      if (lasers[i] != null) lasers[i].update(elapsedTime);
    }
  }
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
  if (!gameOver) player.render(elapsedTime, ctx); // render player
  for (var i = 0; i < asteroids.length; i++) {
    asteroids[i].render(elapsedTime, ctx);
  }
  for (var i = 0; i < lasers.length; i++)
  {
    lasers[i].render(elapsedTime, ctx);
  }

  if (!gameOver)
  {
    // level and score
    ctx.fillStyle = "White";
    ctx.font = "15px Impact";
    ctx.fillText("Level : " + level, 10, 20);
    ctx.fillText("Lives : " + lives, 10, 40);
    ctx.fillText("Score : " + score, 8, 60);
  }
  else {
    ctx.fillStyle = "White";
    ctx.font = "30px Impact";
    ctx.fillText("GAME OVER", canvas.width/2 - 67, canvas.height/2 - 20);
    ctx.fillText("LEVEL: " + level + "      SCORE: " + score, canvas.width/2 - 105, canvas.height/2 + 40);
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

// check for collisions between potentially colliding asteroids, lasers, players
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
      if (ast.radius > closest.radius) asteroidCollision(ast, closest);
      if (ast.radius <= closest.radius) asteroidCollision(closest, ast);
      checkForNextLevel();
    }
    //ast.hit = false;
    //closest.hit = false;
  }

  // asteroid is shot with laser
  for (var i = 0; i < lasers.length; i++)
  {
    var laz = lasers[i];
    var distance = Math.sqrt( Math.pow(((laz.position.x - 15*(laz.velocity.x)) - ast.position.x), 2) + Math.pow(((laz.position.y + 15*(laz.velocity.y)) - ast.position.y), 2));
    var distance2 = Math.sqrt( Math.pow(((laz.position.x - ast.position.x), 2)) + Math.pow((laz.position.y + ast.position.y), 2));
    if (distance < ast.radius+5 || distance2 < ast.radius+5)
    {
      remove(lasers, laz);
      if (ast.type == 0) score += 10;
      if (ast.type == 1) score += 5;
      if (ast.type == 2) score += 3;
      if (ast.type == 3) score += 1;
      shatterAsteroid(laz, ast);
      checkForNextLevel();
    }
    //ast.hit = false;
  }
  var distance2 = Math.sqrt( Math.pow((player.position.x - ast.position.x), 2) + Math.pow((player.position.y - ast.position.y), 2));

  // asteroid collides with player
  if (distance2 < (ast.radius + 7) && player.immune == false)
  {
    lives--;
    if (lives == 0) gameOver = true;
    else {
      player.position = {x: canvas.width/2, y: canvas.height/2};
      player.velocity = {x: 0, y: 0};
      player.immune = true;
      immuneTimer = 0;
    }
  }
  //ast.hit = false;
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

function shatterAsteroid(laser, asteroid)
{
  if (asteroid.type == 0) {remove(asteroids, asteroid); }
  else {
    var newAng1 = laser.angle + (45*0.0174533);
    var newAng2 = laser.angle - (45*0.0174533);
    var newVelX1 = Math.cos(newAng1);
    var newVelY1 = Math.sin(newAng1);
    var newVelX2 = Math.cos(newAng2);
    var newVelY2 = Math.sin(newAng2);
    var newPos1 = {x: asteroid.position.x + asteroid.radius*newVelX1,
                   y: asteroid.position.y - asteroid.radius*newVelY1};
    var newPos2 = {x: asteroid.position.x + asteroid.radius*newVelX2,
                   y: asteroid.position.y - asteroid.radius*newVelY2};;
    var Ast1 = new Asteroid(newPos1, canvas, asteroid.type-1, newAng1);
    var Ast2 = new Asteroid(newPos2, canvas, asteroid.type-1, newAng2);
    remove(asteroids, asteroid);
    asteroids.push(Ast1);
    asteroids.push(Ast2);
  }

}

function asteroidCollision(ast1, ast2)
{
  // same size bounce
  if (ast1.type == ast2.type) {
    if (ast1.type == 0)
    {
      remove(asteroids, ast1);
      remove(asteroids, ast2);
    }
    else {
    shatterAsteroid(ast2, ast1);
    shatterAsteroid(ast1, ast2);
    }
  }
  else if (ast2.type == 0)
  {

  }
}

function checkForNextLevel()
{
  if (asteroids.length == 0)
  {
    lives++;
    level++;
    score += 50;
    player.position = {x: canvas.width/2, y: canvas.height/2};
    player.velocity = {x: 0, y: 0};
    player.immune = true;
    immuneTimer = 0;
    initLevel();
  }
}
