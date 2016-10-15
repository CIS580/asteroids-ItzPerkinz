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
