"use strict"

module.exports = exports = Asteroid;

var sizes = [6,12, 20, 32];


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
  this.speed = this.type+1;
  this.radius = sizes[size];
  this.immune = false;
  this.immuneTimer = 0;
}

Asteroid.prototype.update = function(time)
{
  this.immuneTimer += time;
  if (this.immuneTimer > 2000) this.immune = false;
  switch(this.state) {
    case "moving":
    // move asteroid based on angle (which gives us velocity vectors)
    this.position.x += this.velocity.x / (this.speed);
    this.position.y -= this.velocity.y / (this.speed);

    // wrap around screen
    if(this.position.x < 0) this.position.x += this.worldWidth;
    if(this.position.x > this.worldWidth) this.position.x -= this.worldWidth;
    if(this.position.y < 0) this.position.y += this.worldHeight;
    if(this.position.y > this.worldHeight) this.position.y -= this.worldHeight;
    break;
  }
}

Asteroid.prototype.render = function(time, ctx)
{
  // draws a white circle for the asteroid
  ctx.fillStyle = "Grey";
  ctx.beginPath();
  ctx.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI);
  ctx.closePath();
  ctx.fill();
  }
