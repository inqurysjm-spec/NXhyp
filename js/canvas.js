var _canvas = null;
var _ctx = null;
var _isDrawing = false;
var _lastX = 0;
var _lastY = 0;

function initDrawCanvas(canvasId) {
  _canvas = document.getElementById(canvasId);
  if (!_canvas) return;
  _ctx = _canvas.getContext('2d');
  _ctx.fillStyle = '#ffffff';
  _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
  _ctx.lineCap = 'round';
  _ctx.lineJoin = 'round';

  _canvas.addEventListener('mousedown', startDraw);
  _canvas.addEventListener('mousemove', draw);
  _canvas.addEventListener('mouseup', stopDraw);
  _canvas.addEventListener('mouseleave', stopDraw);
  _canvas.addEventListener('touchstart', handleTouch, { passive: false });
  _canvas.addEventListener('touchmove', handleTouch, { passive: false });
  _canvas.addEventListener('touchend', stopDraw);
}

function getPos(e) {
  var rect = _canvas.getBoundingClientRect();
  var scaleX = _canvas.width / rect.width;
  var scaleY = _canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function handleTouch(e) {
  e.preventDefault();
  var touch = e.touches[0];
  var rect = _canvas.getBoundingClientRect();
  var scaleX = _canvas.width / rect.width;
  var scaleY = _canvas.height / rect.height;
  var pos = {
    clientX: touch.clientX,
    clientY: touch.clientY
  };
  if (e.type === 'touchstart') startDraw({ clientX: pos.clientX, clientY: pos.clientY });
  else if (e.type === 'touchmove') draw({ clientX: pos.clientX, clientY: pos.clientY });
}

function startDraw(e) {
  _isDrawing = true;
  var pos = getPos(e);
  _lastX = pos.x;
  _lastY = pos.y;
  _ctx.beginPath();
  _ctx.arc(pos.x, pos.y, NX.canvasBrush / 2, 0, Math.PI * 2);
  _ctx.fillStyle = NX.canvasErasing ? '#ffffff' : NX.canvasColor;
  _ctx.fill();
}

function draw(e) {
  if (!_isDrawing) return;
  var pos = getPos(e);
  _ctx.beginPath();
  _ctx.moveTo(_lastX, _lastY);
  _ctx.lineTo(pos.x, pos.y);
  _ctx.strokeStyle = NX.canvasErasing ? '#ffffff' : NX.canvasColor;
  _ctx.lineWidth = NX.canvasBrush;
  _ctx.lineCap = 'round';
  _ctx.stroke();
  _lastX = pos.x;
  _lastY = pos.y;
}

function stopDraw() {
  _isDrawing = false;
}

function clearCanvas() {
  if (!_ctx || !_canvas) return;
  _ctx.fillStyle = '#ffffff';
  _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
}

function setCanvasColor(color) {
  NX.canvasColor = color;
  NX.canvasErasing = false;
  document.querySelectorAll('.color-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.color === color);
  });
  var eraserBtn = document.getElementById('eraser-btn');
  if (eraserBtn) eraserBtn.classList.remove('active');
}

function toggleEraser() {
  NX.canvasErasing = !NX.canvasErasing;
  var btn = document.getElementById('eraser-btn');
  if (btn) btn.classList.toggle('active', NX.canvasErasing);
}

function setBrushSize(size) {
  NX.canvasBrush = parseInt(size);
}

function getCanvasData() {
  if (!_canvas) return '';
  return _canvas.toDataURL('image/png');
}

function setCanvasData(dataUrl) {
  if (!_canvas || !_ctx || !dataUrl) return;
  var img = new Image();
  img.onload = function() {
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    _ctx.drawImage(img, 0, 0, _canvas.width, _canvas.height);
  };
  img.src = dataUrl;
}

// Premade companion drawings
var PREMADES = [
  { id: 0, name: 'Cat', emoji: '🐱' },
  { id: 1, name: 'Dog', emoji: '🐶' },
  { id: 2, name: 'Bunny', emoji: '🐰' },
  { id: 3, name: 'Bear', emoji: '🐻' },
  { id: 4, name: 'Dragon', emoji: '🐲' },
];

function drawPremade(id) {
  if (!_ctx || !_canvas) return;
  clearCanvas();
  var w = _canvas.width;
  var h = _canvas.height;
  _ctx.clearRect(0, 0, w, h);
  _ctx.fillStyle = '#ffffff';
  _ctx.fillRect(0, 0, w, h);

  switch (id) {
    case 0: drawCat(w, h); break;
    case 1: drawDog(w, h); break;
    case 2: drawBunny(w, h); break;
    case 3: drawBear(w, h); break;
    case 4: drawDragon(w, h); break;
  }
}

function drawCat(w, h) {
  var cx = w / 2, cy = h / 2;
  // Body
  _ctx.fillStyle = '#f4a460';
  _ctx.beginPath(); _ctx.ellipse(cx, cy + 20, 35, 45, 0, 0, Math.PI * 2); _ctx.fill();
  // Head
  _ctx.beginPath(); _ctx.arc(cx, cy - 20, 38, 0, Math.PI * 2); _ctx.fill();
  // Ears
  _ctx.fillStyle = '#e8956d';
  _ctx.beginPath(); _ctx.moveTo(cx - 25, cy - 48); _ctx.lineTo(cx - 42, cy - 80); _ctx.lineTo(cx - 8, cy - 62); _ctx.closePath(); _ctx.fill();
  _ctx.beginPath(); _ctx.moveTo(cx + 25, cy - 48); _ctx.lineTo(cx + 42, cy - 80); _ctx.lineTo(cx + 8, cy - 62); _ctx.closePath(); _ctx.fill();
  // Face
  _ctx.fillStyle = '#222';
  _ctx.beginPath(); _ctx.arc(cx - 12, cy - 22, 5, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx + 12, cy - 22, 5, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#ff6b6b';
  _ctx.beginPath(); _ctx.arc(cx, cy - 10, 4, 0, Math.PI * 2); _ctx.fill();
  // Whiskers
  _ctx.strokeStyle = '#666'; _ctx.lineWidth = 1.5;
  _ctx.beginPath(); _ctx.moveTo(cx - 5, cy - 10); _ctx.lineTo(cx - 38, cy - 6); _ctx.stroke();
  _ctx.beginPath(); _ctx.moveTo(cx - 5, cy - 8); _ctx.lineTo(cx - 38, cy - 12); _ctx.stroke();
  _ctx.beginPath(); _ctx.moveTo(cx + 5, cy - 10); _ctx.lineTo(cx + 38, cy - 6); _ctx.stroke();
  _ctx.beginPath(); _ctx.moveTo(cx + 5, cy - 8); _ctx.lineTo(cx + 38, cy - 12); _ctx.stroke();
  // Tail
  _ctx.strokeStyle = '#f4a460'; _ctx.lineWidth = 8;
  _ctx.beginPath(); _ctx.moveTo(cx + 30, cy + 50); _ctx.quadraticCurveTo(cx + 70, cy + 20, cx + 60, cy - 10); _ctx.stroke();
}

function drawDog(w, h) {
  var cx = w / 2, cy = h / 2;
  _ctx.fillStyle = '#d2691e';
  _ctx.beginPath(); _ctx.ellipse(cx, cy + 20, 38, 48, 0, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx, cy - 18, 40, 0, Math.PI * 2); _ctx.fill();
  // Ears (floppy)
  _ctx.fillStyle = '#a0522d';
  _ctx.beginPath(); _ctx.ellipse(cx - 35, cy - 10, 14, 30, -0.3, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.ellipse(cx + 35, cy - 10, 14, 30, 0.3, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#222';
  _ctx.beginPath(); _ctx.arc(cx - 12, cy - 20, 6, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx + 12, cy - 20, 6, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#333';
  _ctx.beginPath(); _ctx.ellipse(cx, cy - 6, 10, 7, 0, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#222';
  _ctx.beginPath(); _ctx.arc(cx - 3, cy - 5, 2, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx + 3, cy - 5, 2, 0, Math.PI * 2); _ctx.fill();
  _ctx.strokeStyle = '#d2691e'; _ctx.lineWidth = 8;
  _ctx.beginPath(); _ctx.moveTo(cx + 28, cy + 55); _ctx.lineTo(cx + 45, cy + 30); _ctx.stroke();
}

function drawBunny(w, h) {
  var cx = w / 2, cy = h / 2;
  _ctx.fillStyle = '#f0f0f0';
  _ctx.beginPath(); _ctx.ellipse(cx, cy + 25, 35, 42, 0, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx, cy - 16, 36, 0, Math.PI * 2); _ctx.fill();
  // Long ears
  _ctx.beginPath(); _ctx.ellipse(cx - 18, cy - 68, 11, 34, -0.15, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.ellipse(cx + 18, cy - 68, 11, 34, 0.15, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#ffb6c1';
  _ctx.beginPath(); _ctx.ellipse(cx - 18, cy - 68, 6, 26, -0.15, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.ellipse(cx + 18, cy - 68, 6, 26, 0.15, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#333';
  _ctx.beginPath(); _ctx.arc(cx - 11, cy - 18, 5, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx + 11, cy - 18, 5, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#ff9999';
  _ctx.beginPath(); _ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2); _ctx.fill();
}

function drawBear(w, h) {
  var cx = w / 2, cy = h / 2;
  _ctx.fillStyle = '#8b6914';
  _ctx.beginPath(); _ctx.ellipse(cx, cy + 22, 40, 48, 0, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx, cy - 18, 40, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx - 30, cy - 48, 16, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx + 30, cy - 48, 16, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#d4a039';
  _ctx.beginPath(); _ctx.ellipse(cx, cy - 4, 22, 16, 0, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#333';
  _ctx.beginPath(); _ctx.arc(cx - 13, cy - 22, 6, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx + 13, cy - 22, 6, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#111';
  _ctx.beginPath(); _ctx.ellipse(cx, cy - 6, 7, 5, 0, 0, Math.PI * 2); _ctx.fill();
}

function drawDragon(w, h) {
  var cx = w / 2, cy = h / 2;
  _ctx.fillStyle = '#2d8a4e';
  _ctx.beginPath(); _ctx.ellipse(cx, cy + 22, 35, 45, 0, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx, cy - 18, 36, 0, Math.PI * 2); _ctx.fill();
  // Spikes/horns
  _ctx.fillStyle = '#1a6634';
  _ctx.beginPath(); _ctx.moveTo(cx - 20, cy - 48); _ctx.lineTo(cx - 30, cy - 80); _ctx.lineTo(cx - 10, cy - 52); _ctx.closePath(); _ctx.fill();
  _ctx.beginPath(); _ctx.moveTo(cx + 20, cy - 48); _ctx.lineTo(cx + 30, cy - 80); _ctx.lineTo(cx + 10, cy - 52); _ctx.closePath(); _ctx.fill();
  _ctx.beginPath(); _ctx.moveTo(cx, cy - 52); _ctx.lineTo(cx, cy - 82); _ctx.lineTo(cx + 10, cy - 55); _ctx.closePath(); _ctx.fill();
  // Wings
  _ctx.fillStyle = 'rgba(45,138,78,0.6)';
  _ctx.beginPath(); _ctx.moveTo(cx - 30, cy); _ctx.quadraticCurveTo(cx - 80, cy - 40, cx - 60, cy + 20); _ctx.closePath(); _ctx.fill();
  _ctx.beginPath(); _ctx.moveTo(cx + 30, cy); _ctx.quadraticCurveTo(cx + 80, cy - 40, cx + 60, cy + 20); _ctx.closePath(); _ctx.fill();
  _ctx.fillStyle = '#ffe066';
  _ctx.beginPath(); _ctx.arc(cx - 12, cy - 22, 6, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx + 12, cy - 22, 6, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#333';
  _ctx.beginPath(); _ctx.arc(cx - 12, cy - 22, 3, 0, Math.PI * 2); _ctx.fill();
  _ctx.beginPath(); _ctx.arc(cx + 12, cy - 22, 3, 0, Math.PI * 2); _ctx.fill();
  // Fire breath
  _ctx.fillStyle = '#ff6b00';
  _ctx.beginPath(); _ctx.arc(cx, cy - 4, 8, 0, Math.PI * 2); _ctx.fill();
  _ctx.fillStyle = '#ffcc00';
  _ctx.beginPath(); _ctx.arc(cx, cy - 4, 4, 0, Math.PI * 2); _ctx.fill();
}
