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

interface Point {
  x: number;
  y: number;
}

type Line = Point[];
const lines: Line[] = []; 
let currentLine: Line | null = null; 

const dispatchDrawingChangedEvent = () => {
  const event = new CustomEvent("drawing-changed");
  canvas.dispatchEvent(event);
};

canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  currentLine = [{ x, y }]; 
  lines.push(currentLine); 
});

canvas.addEventListener("mousemove", (event) => {
  if (!currentLine) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  currentLine.push({ x, y });
  dispatchDrawingChangedEvent(); 
});

canvas.addEventListener("mouseup", () => {
  currentLine = null; 
});

// clear
clearButton.addEventListener("click", () => {
  lines.length = 0; 
  dispatchDrawingChangedEvent(); 
});

// observer
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  for (const line of lines) {
    ctx.beginPath();
    for (let i = 0; i < line.length; i++) {
      const point = line[i];
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
  }
});
