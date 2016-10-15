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
