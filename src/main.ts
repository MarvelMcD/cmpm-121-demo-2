import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "appCanvas";
app.appendChild(canvas);

// buttons
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

const customStickerButton = document.createElement("button");
customStickerButton.textContent = "Add Custom Sticker";
customStickerButton.id = "customStickerButton";
app.appendChild(customStickerButton);

const exportButton = document.createElement("button");
exportButton.textContent = "Export";
exportButton.id = "exportButton";
app.appendChild(exportButton);

const stickersData: string[] = ["🙂", "🌟", "🔥"];

const stickersContainer = document.createElement("div");
stickersContainer.id = "stickersContainer";
app.appendChild(stickersContainer);

const renderStickers = () => {
  stickersContainer.innerHTML = "";
  stickersData.forEach((sticker) => {
    const stickerButton = document.createElement("button");
    stickerButton.textContent = sticker;
    stickerButton.className = "stickerButton";
    stickerButton.addEventListener("click", () => {
      currentTool = "sticker";
      currentSticker = sticker;
      toolMovedEvent();
    });
    stickersContainer.appendChild(stickerButton);
  });
};
renderStickers();

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

interface Sticker extends Drawable {
  x: number;
  y: number;
  emoji: string;
  drag(x: number, y: number): void;
}

const lines: Line[] = [];
const stickersOnCanvas: Sticker[] = [];
const redoStack: Drawable[] = [];
let currentLine: Line | null = null;
let currentThickness: number = 2;
let currentSticker: string | null = null;
let toolPreview: Drawable | null = null;
let currentTool: "line" | "sticker" = "line";
let mouseOnCanvas = false;
let mouseDown = false;

const dispatchDrawingChangedEvent = () => {
  const event = new CustomEvent("drawing-changed");
  canvas.dispatchEvent(event);
};

const toolMovedEvent = () => {
  const event = new CustomEvent("tool-moved");
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

const createSticker = (x: number, y: number, emoji: string): Sticker => ({
  x,
  y,
  emoji,
  drag(newX, newY) {
    this.x = newX;
    this.y = newY;
    dispatchDrawingChangedEvent();
  },
  display(ctx) {
    const size = 24;
    ctx.font = `${size}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  },
});

const createToolPreview = (x: number, y: number): Drawable => ({
  display(ctx) {
    if (currentTool === "sticker" && currentSticker) {
      const size = 24;
      ctx.font = `${size}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(currentSticker, x, y);
    } else if (currentTool === "line") {
      const emoji = "⚫";
      const size = currentThickness * 2;
      ctx.font = `${size}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, x, y);
    }
  },
});

// export
exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;

  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4);

  for (const line of lines) {
    line.display(exportCtx);
  }

  for (const sticker of stickersOnCanvas) {
    sticker.display(exportCtx);
  }

  // download
  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});

// events
canvas.addEventListener("mousedown", (event) => {
  mouseDown = true;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (currentTool === "line") {
    currentLine = createLine(x, y, currentThickness);
    lines.push(currentLine);
    redoStack.length = 0;
  } else if (currentTool === "sticker" && currentSticker) {
    const sticker = createSticker(x, y, currentSticker);
    stickersOnCanvas.push(sticker);
    redoStack.length = 0;
  }

  toolPreview = null;
  dispatchDrawingChangedEvent();
});

canvas.addEventListener("mouseup", () => {
  mouseDown = false;
  currentLine = null;
  dispatchDrawingChangedEvent();
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (!mouseDown && mouseOnCanvas) {
    toolPreview = createToolPreview(x, y);
    dispatchDrawingChangedEvent();
  } else if (mouseDown && currentLine) {
    currentLine.drag(x, y);
  } else if (mouseDown && currentTool === "sticker") {
    const lastSticker = stickersOnCanvas[stickersOnCanvas.length - 1];
    if (lastSticker) lastSticker.drag(x, y);
  }
});

canvas.addEventListener("mouseenter", () => {
  mouseOnCanvas = true;
});

canvas.addEventListener("mouseleave", () => {
  mouseOnCanvas = false;
  toolPreview = null;
  dispatchDrawingChangedEvent();
});

clearButton.addEventListener("click", () => {
  lines.length = 0;
  stickersOnCanvas.length = 0;
  redoStack.length = 0;
  dispatchDrawingChangedEvent();
});

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    redoStack.push(lines.pop()!);
  } else if (stickersOnCanvas.length > 0) {
    redoStack.push(stickersOnCanvas.pop()!);
  }
  dispatchDrawingChangedEvent();
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const lastUndone = redoStack.pop()!;
    if ("points" in lastUndone) lines.push(lastUndone as Line);
    else stickersOnCanvas.push(lastUndone as Sticker);
  }
  dispatchDrawingChangedEvent();
});

thinButton.addEventListener("click", () => {
  currentTool = "line";
  currentThickness = 2;
  toolMovedEvent();
});

thickButton.addEventListener("click", () => {
  currentTool = "line";
  currentThickness = 6;
  toolMovedEvent();
});

customStickerButton.addEventListener("click", () => {
  const newSticker = prompt("Enter a custom sticker emoji:", "🎉");
  if (newSticker) {
    stickersData.push(newSticker);
    renderStickers();
  }
});

// observer
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of lines) {
    line.display(ctx);
  }

  for (const sticker of stickersOnCanvas) {
    sticker.display(ctx);
  }

  if (toolPreview) {
    toolPreview.display(ctx);
  }
});
