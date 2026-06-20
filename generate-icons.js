const { createCanvas } = require("canvas");
const fs = require("fs");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, size, size);

  const center = size / 2;
  const radius = size * 0.35;
  const grad = ctx.createLinearGradient(center - radius, center - radius, center + radius, center + radius);
  grad.addColorStop(0, "#3b82f6");
  grad.addColorStop(1, "#06b6d4");

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "bold " + (size * 0.18) + "px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MACD", center, center - size * 0.05);
  ctx.font = (size * 0.1) + "px sans-serif";
  ctx.fillText("DIVERGENCE", center, center + size * 0.12);

  return canvas.toBuffer("image/png");
}

fs.writeFileSync("public/icon-192.png", generateIcon(192));
fs.writeFileSync("public/icon-512.png", generateIcon(512));
console.log("Icons generated");
