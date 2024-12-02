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

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.id = "undoButton";
app.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.id = "redoButton";
app.appendChild(redoButton);

const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
thinButton.id = "thinButton";
app.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
thickButton.id = "thickButton";
app.appendChild(thickButton);

const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
ctx.strokeStyle = "black";

interface Point {
  x: number;
  y: number;
}

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Line extends Drawable {
  points: Point[];
  thickness: number;
  drag(x: number, y: number): void;
}

const lines: Line[] = [];
const redoStack: Line[] = [];
let currentLine: Line | null = null;
let currentThickness: number = 2;

const dispatchDrawingChangedEvent = () => {
  const event = new CustomEvent("drawing-changed");
  canvas.dispatchEvent(event);
};

const createLine = (x: number, y: number, thickness: number): Line => ({
  points: [{ x, y }],
  thickness,
  drag(x, y) {
    this.points.push({ x, y });
    dispatchDrawingChangedEvent();
  },
  display(ctx) {
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
  },
});

canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  currentLine = createLine(x, y, currentThickness);
  lines.push(currentLine);
  redoStack.length = 0;
});

canvas.addEventListener("mousemove", (event) => {
  if (!currentLine) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  currentLine.drag(x, y);
});

canvas.addEventListener("mouseup", () => {
  currentLine = null;
});

// clear
clearButton.addEventListener("click", () => {
  lines.length = 0;
  redoStack.length = 0;
  dispatchDrawingChangedEvent();
});

// undo
undoButton.addEventListener("click", () => {
  if (lines.length === 0) return;

  const lastLine = lines.pop();
  redoStack.push(lastLine!);
  dispatchDrawingChangedEvent();
});

// redo
redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;

  const lastUndoneLine = redoStack.pop();
  lines.push(lastUndoneLine!);
  dispatchDrawingChangedEvent();
});

thinButton.addEventListener("click", () => {
  currentThickness = 2;
  updateToolSelection();
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  updateToolSelection();
});

const updateToolSelection = () => {
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");

  if (currentThickness === 2) {
    thinButton.classList.add("selectedTool");
  } else {
    thickButton.classList.add("selectedTool");
  }
};

// observer
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas

  for (const line of lines) {
    line.display(ctx); 
  }
});
