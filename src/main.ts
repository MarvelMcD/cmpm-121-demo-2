import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "appCanvas";
app.appendChild(canvas);

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.id = "clearButton";
app.appendChild(clearButton);

const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "black";

let isDrawing = false;

canvas.addEventListener("mousedown", () => {
  isDrawing = true;
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  ctx.lineTo(x, y);
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx.closePath();
});

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
