// Game constants
const BOARD_SIZE = 10;
const CELL_SIZE = 40;
const COLORS = {
    EMPTY: 'transparent',
    FILLED: '#8B4513',
    GRID: '#654321',
    BACKGROUND: '#F5DEB3',
    PIECES: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#F39C12', '#E74C3C',
        '#3498DB', '#2ECC71', '#9B59B6', '#F1C40F'
    ]
};

// Block shapes (different from Tetris - more varied puzzle pieces)
const PIECE_SHAPES = [
    // Single block
    [[1]],
    
    // Two blocks
    [[1, 1]],
    [[1], [1]],
    
    // Three blocks
    [[1, 1, 1]],
    [[1], [1], [1]],
    [[1, 1], [1, 0]],
    [[1, 1], [0, 1]],
    [[1, 0], [1, 1]],
    [[0, 1], [1, 1]],
    
    // Four blocks
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    
    // Five blocks
    [[1, 1, 1, 1, 1]],
    [[1], [1], [1], [1], [1]],
    [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
    [[1, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [0, 0, 1], [1, 1, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [0, 1, 0], [1, 1, 0]],
    [[1, 1, 1, 1], [0, 0, 0, 1]],
    [[1, 1, 1, 1], [1, 0, 0, 0]],
    [[1, 0, 0, 0], [1, 1, 1, 1]],
    [[0, 0, 0, 1], [1, 1, 1, 1]]
];

// Game class
class WoodBlockPuzzle {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('woodBlockPuzzle_highScore') || '0');
        this.linesCleared = 0;
        this.gameOver = false;
        
        // Available pieces
        this.availablePieces = [];
        this.selectedPiece = null;
        this.draggedPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Touch/mouse state
        this.isDragging = false;
        this.lastTouchPos = { x: 0, y: 0 };
        
        // Bind global event handlers
        this.globalMouseMove = this.globalMouseMove.bind(this);
        this.globalMouseUp = this.globalMouseUp.bind(this);
        this.globalTouchMove = this.globalTouchMove.bind(this);
        this.globalTouchEnd = this.globalTouchEnd.bind(this);
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateNewPieces();
        this.updateDisplay();
        this.draw();
    }
    
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Piece selection events
        document.querySelectorAll('.piece-slot').forEach((slot, index) => {
            slot.addEventListener('mousedown', (e) => this.handlePieceSelect(e, index));
            slot.addEventListener('touchstart', (e) => this.handlePieceSelect(e, index));
        });
        
        // Button events
        document.getElementById('newGameButton').addEventListener('click', () => this.newGame());
        document.getElementById('restartButton').addEventListener('click', () => this.newGame());
        document.getElementById('hintButton').addEventListener('click', () => this.showHint());
        
        // Mobile controls
        document.getElementById('rotateBtn').addEventListener('click', () => this.rotatePiece());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        
        // Prevent default drag behavior
        this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.selectedPiece !== null) {
            this.startDragging(x, y);
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || this.selectedPiece === null) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.draggedPiece = {
            x: x - this.dragOffset.x,
            y: y - this.dragOffset.y
        };
        
        this.draw();
    }
    
    handleMouseUp(e) {
        if (!this.isDragging || this.selectedPiece === null) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.tryPlacePiece(x, y);
        this.stopDragging();
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        if (this.selectedPiece !== null) {
            this.startDragging(x, y);
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging || this.selectedPiece === null) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.draggedPiece = {
            x: x - this.dragOffset.x,
            y: y - this.dragOffset.y
        };
        
        this.draw();
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.isDragging || this.selectedPiece === null) return;
        
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.tryPlacePiece(x, y);
        this.stopDragging();
    }
    
    handlePieceSelect(e, pieceIndex) {
        e.preventDefault();
        
        if (!this.availablePieces[pieceIndex]) return;
        
        // Clear previous selection
        document.querySelectorAll('.piece-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Select new piece
        this.selectedPiece = pieceIndex;
        document.querySelectorAll('.piece-slot')[pieceIndex].classList.add('selected');
        
        // Start dragging immediately
        if (e.type === 'touchstart') {
            const touch = e.touches[0];
            this.startDraggingFromPiece(touch.clientX, touch.clientY);
        } else {
            this.startDraggingFromPiece(e.clientX, e.clientY);
        }
    }
    
    startDragging(x, y) {
        this.isDragging = true;
        const piece = this.availablePieces[this.selectedPiece];
        const pieceWidth = piece.shape[0].length * CELL_SIZE;
        const pieceHeight = piece.shape.length * CELL_SIZE;
        this.dragOffset = { x: pieceWidth / 2, y: pieceHeight / 2 }; // Center based on actual piece size
        this.draggedPiece = { x: x - this.dragOffset.x, y: y - this.dragOffset.y };
    }
    
    startDraggingFromPiece(globalX, globalY) {
        this.isDragging = true;
        const piece = this.availablePieces[this.selectedPiece];
        const pieceWidth = piece.shape[0].length * CELL_SIZE;
        const pieceHeight = piece.shape.length * CELL_SIZE;
        this.dragOffset = { x: pieceWidth / 2, y: pieceHeight / 2 }; // Center based on actual piece size
        this.draggedPiece = { x: globalX - this.dragOffset.x, y: globalY - this.dragOffset.y };
        
        // Add visual feedback
        document.body.style.cursor = 'grabbing';
        
        // Add event listeners for global mouse/touch movement
        document.addEventListener('mousemove', this.globalMouseMove);
        document.addEventListener('mouseup', this.globalMouseUp);
        document.addEventListener('touchmove', this.globalTouchMove);
        document.addEventListener('touchend', this.globalTouchEnd);
        
        this.draw();
    }
    
    stopDragging() {
        this.isDragging = false;
        this.draggedPiece = null;
        document.body.style.cursor = 'default';
        
        // Remove global event listeners
        document.removeEventListener('mousemove', this.globalMouseMove);
        document.removeEventListener('mouseup', this.globalMouseUp);
        document.removeEventListener('touchmove', this.globalTouchMove);
        document.removeEventListener('touchend', this.globalTouchEnd);
        
        this.draw();
    }
    
    globalMouseMove(e) {
        if (!this.isDragging || this.selectedPiece === null) return;
        
        this.draggedPiece = {
            x: e.clientX - this.dragOffset.x,
            y: e.clientY - this.dragOffset.y
        };
        
        this.draw();
    }
    
    globalMouseUp(e) {
        if (!this.isDragging || this.selectedPiece === null) return;
        
        // Check if we're dropping on the canvas
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        let placed = false;
        if (canvasX >= 0 && canvasX <= this.canvas.width && 
            canvasY >= 0 && canvasY <= this.canvas.height) {
            placed = this.tryPlacePiece(canvasX, canvasY);
        }
        
        if (!placed) {
            this.animateReturn();
        } else {
            this.stopDragging();
        }
    }
    
    globalTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging || this.selectedPiece === null) return;
        
        const touch = e.touches[0];
        this.draggedPiece = {
            x: touch.clientX - this.dragOffset.x,
            y: touch.clientY - this.dragOffset.y
        };
        
        this.draw();
    }
    
    globalTouchEnd(e) {
        e.preventDefault();
        if (!this.isDragging || this.selectedPiece === null) return;
        
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = touch.clientX - rect.left;
        const canvasY = touch.clientY - rect.top;
        
        let placed = false;
        if (canvasX >= 0 && canvasX <= this.canvas.width && 
            canvasY >= 0 && canvasY <= this.canvas.height) {
            placed = this.tryPlacePiece(canvasX, canvasY);
        }
        
        if (!placed) {
            this.animateReturn();
        } else {
            this.stopDragging();
        }
    }
    
    tryPlacePiece(x, y) {
        if (this.selectedPiece === null || !this.availablePieces[this.selectedPiece]) return false;
        
        const piece = this.availablePieces[this.selectedPiece];
        
        // Calculate the center of the piece
        const pieceWidth = piece.shape[0].length;
        const pieceHeight = piece.shape.length;
        const pieceCenterX = pieceWidth / 2;
        const pieceCenterY = pieceHeight / 2;
        
        // Adjust position to account for piece center
        const adjustedX = x - (pieceCenterX - 0.5) * CELL_SIZE;
        const adjustedY = y - (pieceCenterY - 0.5) * CELL_SIZE;
        
        // Convert to board coordinates with improved snapping
        let boardX = Math.round(adjustedX / CELL_SIZE);
        let boardY = Math.round(adjustedY / CELL_SIZE);
        
        // Add magnetic snapping for better mobile experience
        const snapThreshold = CELL_SIZE * 0.3; // 30% of cell size
        const exactX = adjustedX / CELL_SIZE;
        const exactY = adjustedY / CELL_SIZE;
        
        // Check if we're close to grid lines and snap to them
        const nearestX = Math.round(exactX);
        const nearestY = Math.round(exactY);
        
        if (Math.abs(exactX - nearestX) < snapThreshold / CELL_SIZE) {
            boardX = nearestX;
        }
        if (Math.abs(exactY - nearestY) < snapThreshold / CELL_SIZE) {
            boardY = nearestY;
        }
        
        if (this.canPlacePiece(boardX, boardY, piece.shape)) {
            this.placePiece(boardX, boardY, piece.shape, piece.color);
            this.removePiece(this.selectedPiece);
            this.clearSelectedPiece();
            this.checkForClears();
            this.checkGameOver();
            return true;
        }
        return false;
    }
    
    animateReturn() {
        // Simple return animation - just stop dragging
        this.stopDragging();
    }
    
    canPlacePiece(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    if (boardX < 0 || boardX >= BOARD_SIZE || 
                        boardY < 0 || boardY >= BOARD_SIZE || 
                        this.board[boardY][boardX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece(x, y, shape, color) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.board[y + row][x + col] = color;
                }
            }
        }
        
        // Add score for placing piece
        this.score += shape.flat().filter(cell => cell).length * 10;
        this.updateDisplay();
    }
    
    removePiece(index) {
        this.availablePieces[index] = null;
        this.drawPieces();
        
        // Check if we need new pieces
        if (this.availablePieces.every(piece => piece === null)) {
            this.generateNewPieces();
        }
    }
    
    clearSelectedPiece() {
        this.selectedPiece = null;
        document.querySelectorAll('.piece-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
    }
    
    checkForClears() {
        const linesToClear = [];
        const colsToClear = [];
        
        // Check rows
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (this.board[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }
        
        // Check columns
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (this.board.every(row => row[col] !== 0)) {
                colsToClear.push(col);
            }
        }
        
        // Clear lines and columns
        if (linesToClear.length > 0 || colsToClear.length > 0) {
            this.clearLinesAndColumns(linesToClear, colsToClear);
        }
    }
    
    clearLinesAndColumns(lines, cols) {
        // Clear rows
        lines.forEach(row => {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.board[row][col] = 0;
            }
        });
        
        // Clear columns
        cols.forEach(col => {
            for (let row = 0; row < BOARD_SIZE; row++) {
                this.board[row][col] = 0;
            }
        });
        
        // Calculate score
        const totalCleared = lines.length + cols.length;
        this.score += totalCleared * 100;
        this.linesCleared += totalCleared;
        
        // Add particles effect
        this.createParticles(lines, cols);
        
        this.updateDisplay();
    }
    
    createParticles(lines, cols) {
        const particles = [];
        
        // Create particles for cleared lines
        lines.forEach(row => {
            for (let col = 0; col < BOARD_SIZE; col++) {
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: col * CELL_SIZE + CELL_SIZE / 2,
                        y: row * CELL_SIZE + CELL_SIZE / 2,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 1.0,
                        color: '#FFD700'
                    });
                }
            }
        });
        
        // Create particles for cleared columns
        cols.forEach(col => {
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: col * CELL_SIZE + CELL_SIZE / 2,
                        y: row * CELL_SIZE + CELL_SIZE / 2,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 1.0,
                        color: '#FFD700'
                    });
                }
            }
        });
        
        // Animate particles
        this.animateParticles(particles);
    }
    
    animateParticles(particles) {
        const animate = () => {
            this.draw();
            
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= 0.02;
                
                if (particle.life > 0) {
                    this.ctx.save();
                    this.ctx.globalAlpha = particle.life;
                    this.ctx.fillStyle = particle.color;
                    this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
                    this.ctx.restore();
                }
            });
            
            particles.splice(0, particles.length, ...particles.filter(p => p.life > 0));
            
            if (particles.length > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    checkGameOver() {
        // Check if any available piece can be placed
        for (let piece of this.availablePieces) {
            if (piece && this.canPieceBePlace(piece.shape)) {
                return false;
            }
        }
        
        // No pieces can be placed
        this.gameOver = true;
        this.showGameOver();
        return true;
    }
    
    canPieceBePlace(shape) {
        for (let row = 0; row <= BOARD_SIZE - shape.length; row++) {
            for (let col = 0; col <= BOARD_SIZE - shape[0].length; col++) {
                if (this.canPlacePiece(col, row, shape)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    showGameOver() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('woodBlockPuzzle_highScore', this.highScore.toString());
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    generateNewPieces() {
        this.availablePieces = [];
        
        for (let i = 0; i < 3; i++) {
            const shapeIndex = Math.floor(Math.random() * PIECE_SHAPES.length);
            const colorIndex = Math.floor(Math.random() * COLORS.PIECES.length);
            
            this.availablePieces.push({
                shape: PIECE_SHAPES[shapeIndex],
                color: COLORS.PIECES[colorIndex]
            });
        }
        
        this.drawPieces();
    }
    
    drawPieces() {
        const slots = document.querySelectorAll('.piece-slot canvas');
        
        slots.forEach((canvas, index) => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const piece = this.availablePieces[index];
            if (!piece) {
                canvas.parentElement.classList.add('disabled');
                return;
            }
            
            canvas.parentElement.classList.remove('disabled');
            
            const shape = piece.shape;
            const cellSize = Math.min(
                (canvas.width - 20) / shape[0].length,
                (canvas.height - 20) / shape.length
            );
            
            const offsetX = (canvas.width - shape[0].length * cellSize) / 2;
            const offsetY = (canvas.height - shape.length * cellSize) / 2;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        this.drawWoodBlock(
                            ctx,
                            offsetX + col * cellSize,
                            offsetY + row * cellSize,
                            cellSize - 2,
                            piece.color
                        );
                    }
                }
            }
        });
    }
    
    rotatePiece() {
        if (this.selectedPiece === null || !this.availablePieces[this.selectedPiece]) return;
        
        const piece = this.availablePieces[this.selectedPiece];
        const rotated = this.rotateShape(piece.shape);
        piece.shape = rotated;
        
        this.drawPieces();
    }
    
    rotateShape(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                rotated[col][rows - 1 - row] = shape[row][col];
            }
        }
        
        return rotated;
    }
    
    showHint() {
        // Find the first available piece that can be placed
        for (let pieceIndex = 0; pieceIndex < this.availablePieces.length; pieceIndex++) {
            const piece = this.availablePieces[pieceIndex];
            if (!piece) continue;
            
            for (let row = 0; row <= BOARD_SIZE - piece.shape.length; row++) {
                for (let col = 0; col <= BOARD_SIZE - piece.shape[0].length; col++) {
                    if (this.canPlacePiece(col, row, piece.shape)) {
                        this.highlightHint(col, row, piece.shape);
                        return;
                    }
                }
            }
        }
    }
    
    highlightHint(x, y, shape) {
        this.draw();
        
        // Draw hint overlay
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = '#FFD700';
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.ctx.fillRect(
                        (x + col) * CELL_SIZE + 2,
                        (y + row) * CELL_SIZE + 2,
                        CELL_SIZE - 4,
                        CELL_SIZE - 4
                    );
                }
            }
        }
        
        this.ctx.restore();
        
        // Clear hint after 2 seconds
        setTimeout(() => {
            this.draw();
        }, 2000);
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw board
        this.drawBoard();
        
        // Draw dragged piece
        if (this.isDragging && this.draggedPiece && this.selectedPiece !== null) {
            this.drawDraggedPiece();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = COLORS.GRID;
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= BOARD_SIZE; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * CELL_SIZE, 0);
            this.ctx.lineTo(i * CELL_SIZE, BOARD_SIZE * CELL_SIZE);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * CELL_SIZE);
            this.ctx.lineTo(BOARD_SIZE * CELL_SIZE, i * CELL_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawBoard() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawWoodBlock(
                        this.ctx,
                        col * CELL_SIZE + 1,
                        row * CELL_SIZE + 1,
                        CELL_SIZE - 2,
                        this.board[row][col]
                    );
                }
            }
        }
    }
    
    drawDraggedPiece() {
        if (!this.availablePieces[this.selectedPiece]) return;
        
        const piece = this.availablePieces[this.selectedPiece];
        const shape = piece.shape;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.9;
        
        // Add shadow effect
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawWoodBlock(
                        this.ctx,
                        this.draggedPiece.x + col * CELL_SIZE,
                        this.draggedPiece.y + row * CELL_SIZE,
                        CELL_SIZE - 2,
                        piece.color
                    );
                }
            }
        }
        
        this.ctx.restore();
        
        // Show placement preview on valid positions
        this.showPlacementPreview();
    }
    
    showPlacementPreview() {
        const canvasX = this.draggedPiece.x + this.dragOffset.x;
        const canvasY = this.draggedPiece.y + this.dragOffset.y;
        const piece = this.availablePieces[this.selectedPiece];
        
        // Use the same logic as tryPlacePiece for consistent positioning
        const pieceWidth = piece.shape[0].length;
        const pieceHeight = piece.shape.length;
        const pieceCenterX = pieceWidth / 2;
        const pieceCenterY = pieceHeight / 2;
        
        const adjustedX = canvasX - (pieceCenterX - 0.5) * CELL_SIZE;
        const adjustedY = canvasY - (pieceCenterY - 0.5) * CELL_SIZE;
        
        const boardX = Math.round(adjustedX / CELL_SIZE);
        const boardY = Math.round(adjustedY / CELL_SIZE);
        
        if (this.canPlacePiece(boardX, boardY, piece.shape)) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.4;
            this.ctx.fillStyle = '#00FF00';
            this.ctx.strokeStyle = '#008800';
            this.ctx.lineWidth = 2;
            
            for (let row = 0; row < piece.shape.length; row++) {
                for (let col = 0; col < piece.shape[row].length; col++) {
                    if (piece.shape[row][col]) {
                        const x = (boardX + col) * CELL_SIZE + 2;
                        const y = (boardY + row) * CELL_SIZE + 2;
                        const size = CELL_SIZE - 4;
                        
                        this.ctx.fillRect(x, y, size, size);
                        this.ctx.strokeRect(x, y, size, size);
                    }
                }
            }
            
            this.ctx.restore();
        } else {
            // Show red preview for invalid placement
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.strokeStyle = '#880000';
            this.ctx.lineWidth = 2;
            
            for (let row = 0; row < piece.shape.length; row++) {
                for (let col = 0; col < piece.shape[row].length; col++) {
                    if (piece.shape[row][col]) {
                        const x = (boardX + col) * CELL_SIZE + 2;
                        const y = (boardY + row) * CELL_SIZE + 2;
                        const size = CELL_SIZE - 4;
                        
                        if (boardX + col >= 0 && boardX + col < BOARD_SIZE && 
                            boardY + row >= 0 && boardY + row < BOARD_SIZE) {
                            this.ctx.fillRect(x, y, size, size);
                            this.ctx.strokeRect(x, y, size, size);
                        }
                    }
                }
            }
            
            this.ctx.restore();
        }
    }
    
    drawWoodBlock(ctx, x, y, size, color) {
        // Draw main block
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
        
        // Draw wood texture effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, y, size, 3);
        ctx.fillRect(x, y, 3, size);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y + size - 3, size, 3);
        ctx.fillRect(x + size - 3, y, 3, size);
        
        // Draw wood grain lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const lineY = y + (size / 4) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(x + 2, lineY);
            ctx.lineTo(x + size - 2, lineY);
            ctx.stroke();
        }
        
        // Draw border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('lines').textContent = this.linesCleared;
    }
    
    newGame() {
        this.board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
        this.score = 0;
        this.linesCleared = 0;
        this.gameOver = false;
        this.clearSelectedPiece();
        
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.generateNewPieces();
        this.updateDisplay();
        this.draw();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new WoodBlockPuzzle();
});