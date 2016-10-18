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

// Audio
var laser = new Audio("assets/laser1.wav");
laser.volume = 0.2;
var alarm = new Audio("assets/alarm.ogg");
alarm.volume = 0.1;
var crash = new Audio("assets/crash.wav");
crash.volume = 0.1;
var background = new Audio("assets/background.mp3");
background.loop = true;
background.volume = 0.1;
background.play();

// window.onkeypress just randomly stopped working for me halfway through the project so i had to move these outside of the player class so that i could handle lasers as well.
window.onkeydown = function(event) {
  event.preventDefault()
  if (event.keyCode == 32)
  {
    if(timer > 150 && player.immune == false) {
      var laz = new Laser(player.position, player.angle + (90 * 0.0174533));
      lasers.push(laz);
      timer = 0;
      laser.play();
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

//initialize the level
function initLevel()
{
  // create asteroids
  for (var i = 0; i < Math.floor((9 + level)); i++) {
    var randX = Math.random()*canvas.width;                                     // chooses a random x value
    var randY = Math.random()*canvas.height;
    var position = {x: randX, y: randY};                                         // creates the position to pass into asteroid
    var ang = Math.random()*360 * 0.0174533;                                    // creates the random angle in radians
    var size = Math.floor(Math.random()*4);                                     // determines the size
    if (i < 3) { var newAstX = new Asteroid(position, canvas, 3, ang); }        // spawn at least 2 large asteroids
    else { var newAstX = new Asteroid(position, canvas, size, ang); }
    asteroids.push(newAstX);
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
      if (asteroids[i].immune == false) checkForCollisions(asteroids[i]);
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

// remove an element from an array
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
    alarm.play();
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
  crash.play();
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
      var temp = ast1.velocity;
      ast1.velocity = ast2.velocity;
      ast2.velocity = temp;
    }
    else {
    //collide(ast1, ast2);
    shatterAsteroid(ast2, ast1);
    shatterAsteroid(ast1, ast2);
    }
  }
  else if (ast2.type == 0)
  {
    shatterAsteroid(ast2, ast1);
    remove(asteroids, ast2);
  }
  else if (ast1.type - ast2.type >= 2)
  {
    shatterAsteroid(ast2, ast1);
  }
  else {
    //collide(ast1, ast2);
    shatterAsteroid(ast2, ast1);
    shatterAsteroid(ast1, ast2);
  }
}

function checkForNextLevel()
{
  if (asteroids.length == 0)
  {
    level++;
    score += 50;
    player.position = {x: canvas.width/2, y: canvas.height/2};
    player.velocity = {x: 0, y: 0};
    player.immune = true;
    immuneTimer = 0;
    initLevel();
  }
}
/*
function collide(ast1, ast2)
{
  var newVel = {x: ast1.velocity.x - ast2.velocity.x, y: ast1.velocity.y - ast2.velocity.y};
  var tan = newVel.x / newVel.y;
  var newAng = Math.atan(tan);
  // new angles
  var newAng1 = newAng + (90*0.0174533);
  var newAng2 = newAng + (45*0.0174533);
  var newAng3 = newAng - (45*0.0174533);
  var newAng4 = newAng - (90*0.0174533);

  // new velocity
  var newVel1 = {x: Math.cos(newAng1), y: Math.sin(newAng1)};
  var newVel2 = {x: Math.cos(newAng2), y: Math.sin(newAng2)};
  var newVel3 = {x: Math.cos(newAng3), y: Math.sin(newAng3)};
  var newVel4 = {x: Math.cos(newAng4), y: Math.sin(newAng4)};


  // new asteroids
  var newAst1 = new Asteroid(ast1.position, canvas, ast1.type-1, newAng1); newAst1.immune = true; newAst1.immuneTimer = 0;
  var newAst2 = new Asteroid(ast1.position, canvas, ast1.type-1, newAng2); newAst2.immune = true; newAst2.immuneTimer = 0;
  var newAst3 = new Asteroid(ast2.position, canvas, ast2.type-1, newAng3); newAst3.immune = true; newAst3.immuneTimer = 0;
  var newAst4 = new Asteroid(ast2.position, canvas, ast2.type-1, newAng4); newAst4.immune = true; newAst4.immuneTimer = 0;

  // remove old asteroids
  remove(asteroids, ast1);
  remove(asteroids, ast2);

  //place new asteroids
  asteroids.push(newAst1);
  asteroids.push(newAst2);
  asteroids.push(newAst3);
  asteroids.push(newAst4);
}
*/
