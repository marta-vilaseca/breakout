/*
	INDEX
	================================
	DOM: About & Credits
	DOM: Rules
	DOM: Finished Game
	CANVAS: init necessary variables
	GAME: init necessary variables
	GAME: extras
	GAME: Audio files
	GAME PROPS: Paddle
	GAME PROPS: Ball
	GAME PROPS: Bricks
	GAME: DRAWING ELEMENTS: Ball
	GAME: DRAWING ELEMENTS: Paddle
	GAME: DRAWING ELEMENTS: Score
	GAME: DRAWING ELEMENTS: Lives counter
	GAME: DRAWING ELEMENTS: Bricks
	GAME: MOVE ELEMENTS: Paddle
	GAME: MOVE ELEMENTS: Ball
	GAME: MECHANICS: End
	GAME: MECHANICS: Start New Round
	GAME: MECHANICS: Increase Score
	GAME: Draw Everything
	GAME: Update canvas drawing and animation
	GAME: INIT
	EVENTS: keyDown
	EVENTS: keyUp
	EVENT HANDLERS: Keyboard
	EVENT HANDLERS: Button
*/

// DOM: About & Credits 
const creditsBtn = document.getElementById('credits-btn');
const closeCreditsBtn = document.getElementById('credits-close-btn');
const credits = document.getElementById('credits');
// DOM: Rules
const rulesBtn = document.getElementById('rules-btn');
const closeRulesBtn = document.getElementById('rules-close-btn');
const rules = document.getElementById('rules');
// DOM: Finished Game
const wonGame = document.getElementById('wonGame');
const lostGame = document.getElementById('lostGame');
const finalScore = document.querySelectorAll('.yourFinalScore');
const lostGameBtn = document.getElementById('lostGame-btn');
const wonGameBtn = document.getElementById('wonGame-btn');
const playAgainBtn = document.querySelectorAll('.playAgain-btn');

// CANVAS: init necessary variables
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// GAME: init necessary variables
let score = 0;
let livesLeft = 5;
const brickRowCount = 9;
const brickColumnCount = 8;
/* We need to keep track of when the game is ongoing (true) and when is finished (false)
   for a variety of purposes:
	- As long as the game is ONGOING, we will play a sound every time we lose a ball
	- When the game is FINISHED by either winning or losing, is set as such to prevent the
	  update() function from refreshing over and over
	- The space/arrowUp keys will only launch the ball if the game is ONOING. Keys will 
	  become unresponsive once the game is FINISHED.
*/
let gameActive = true; 

// GAME: extras
/* 
	To make scores more varied and interesting, I've added a scoreMultiplier bonus.
	The more bricks you can hit before the ball bounces back on the paddle, the higher the bonus.
	This will reset once the ball bounces back on the paddle, OR every time you lose a ball
*/
let scoreMultiplier; 
/* 
	Added an ironBallCheat that you can toggle on/off with 'i'.
	The ball keeps going straight ahead and breaking every brick on its trajectory,
	instead of bouncing back with every collision.
	Obviously makes destruction easier, so when using this the score multiplier doesn't apply
*/
let ironBallCheat = false;
let ballColor = '#eee';
/*
	 I was thinking about including an extra long paddle cheat.
	 Finally decided not to, but decided to define the paddle length with a variable anyway
	 because it makes it easier to test different lengths
*/
// let longPaddleCheat = false;
let paddleBaseLength = 80;
let paddleLength = paddleBaseLength;



// GAME: Audio files
const paddleAudio = new Audio("./sound/paddle.wav");
const lostBallAudio = new Audio("./sound/lostball.wav");
const wallAudio = new Audio("./sound/wall.wav");
const brickAudio = new Audio("./sound/brick.wav");
const ironBallAudio = new Audio("./sound/ironball.wav");
const youloseAudio = new Audio("./sound/_youlose.wav");
const youwinAudio = new Audio("./sound/_youwin.wav");

// GAME PROPS: Paddle
const paddle = {
	// w: 80,
	w: paddleLength,
	h: 12,
	x: canvas.width / 2 - paddleLength / 2,
	y: canvas.height - 22,
	speed: 10,
	dx: 0
}

// GAME PROPS: Ball
const ball = {
	x: canvas.width / 2,
	y: canvas.height - paddle.h + - 20,
	offsetX: 0,
	size: 10,
	speed: 4,
	dx: 5,
	dy: -5,
}

// GAME PROPS: Bricks
const colors = ["#ff499e","#d264b6","#a480cf","#779be7","#49b6ff","#9cfffa","#acf39d", "#FEFE78"];
const brickInfo = {
	w: 70,
	h: 20,
	padding: 10,
	offsetX: 45,
	offsetY: 60,
	visible: true
}

let bricks = [];
for(let i = 0; i < brickRowCount; i++) {
	bricks[i] = [];
	for(let j = 0; j < brickColumnCount; j++) {
		const x = i * (brickInfo.w + brickInfo.padding) + brickInfo.offsetX;
		const y = j * (brickInfo.h + brickInfo.padding) + brickInfo.offsetY;
		const fillColor = colors[j]; // this will make every row a different color from the colors array above
		bricks[i][j] = {x, y, fillColor, ...brickInfo};
	}
}

// GAME: DRAWING ELEMENTS: Ball
/* 	We set up the fillStyle dynamically because we will need to update the ball color
	every time we turn the Iron Ball Cheat on and off  */
function drawBall(val) {
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
	ctx.fillStyle = val;
	ctx.fill();
	ctx.closePath();
}

// GAME: DRAWING ELEMENTS: Paddle
function drawPaddle(val) {
	ctx.beginPath();
	ctx.rect(paddle.x, paddle.y, val, paddle.h);
	ctx.fillStyle = '#888';
	ctx.fill();
	ctx.closePath();
}

// GAME: DRAWING ELEMENTS: Score
function drawScore() {
	ctx.font = '20px Arial';
	ctx.textAlign = "right";
	ctx.fillText(`Score: ${score}`, canvas.width -20, 30);
	
}

// GAME: DRAWING ELEMENTS: Lives counter
function drawLives() {
	ctx.font = '20px Arial';
	ctx.textAlign = "left";
	ctx.fillText(`Lives: ${livesLeft}`, 20, 30);	
}

// GAME: DRAWING ELEMENTS: Bricks
function drawBricks() {
	bricks.forEach(column => {
		column.forEach(brick => {
			ctx.beginPath();
			ctx.rect(brick.x, brick.y, brick.w, brick.h);
			ctx.fillStyle = brick.visible ? brick.fillColor : 'transparent';
			ctx.fill();
			ctx.closePath();
		})
	})
}

// GAME: MOVE ELEMENTS: Paddle
function movePaddle() {
	paddle.x += paddle.dx;

	// Wall detection
	if(paddle.x + paddle.w > canvas.width) {
		paddle.x = canvas.width - paddle.w;
	}

	if(paddle.x < 0) {
		paddle.x = 0;
	}
}

// GAME: MOVE ELEMENTS: Ball
function moveBall() {	
	ball.dx !== 0 ? ball.x += ball.dx : ball.x = paddle.x + (paddle.w / 2);
	ball.dy !== 0 ? ball.y += ball.dy : ball.y = ball.y;

	// Wall colision (right/left)
	if(ball.x + ball.size > canvas.width || ball.x - ball.size < 0) {
		wallAudio.play();
		ball.dx *= -1;
	}

	// Wall colision (top/bottom)
	if(ball.y + ball.size > canvas.height || ball.y - ball.size < 0) {
		wallAudio.play();
		ball.dy *= -1;
	}

	// Paddle collision
	if(ball.x - ball.size > paddle.x && ball.x + ball.size < paddle.x + paddle.w && ball.y + ball.size > paddle.y) {
		paddleAudio.play();
		scoreMultiplier = 0; // every time we hit the paddle, score multiplier is reset to default value
		ball.dy = -ball.speed;
	}

	// Brick collision
	bricks.forEach(column => {
		column.forEach(brick => {
			if(brick.visible) {
				if(
					ball.x - ball.size > brick.x && //left brick side check
					ball.x + ball.size < brick.x + brick.w && //right brick side check
					ball.y + ball.size > brick.y && //top brick side check
					ball.y - ball.size < brick.y + brick.h //bottom brick side check
				) {
					/* If Iron Ball Cheat is ON:
						- We play the special hit sound
						- The score multiplier is fixed to 1 (we get no bonus)
						- The Iron Ball mechanic is defined here because once it hits
						  a brick, it DOESN'T bounce back
					*/
					if (ironBallCheat === true) {
						ironBallAudio.play();
						scoreMultiplier = 1;
					/* If Iron Ball Cheat is OFF:
						- We play the default hit sound
						- The score multiplier increases with every hit
						- The Ball DOES bounce back with every hit
					*/
					} else { 
						brickAudio.play();
						ball.dy *= -1;
						scoreMultiplier++;
					}
					
					/* with every brick we hit, 
						- we turn its visibility off
						- we increase the score
					*/
					brick.visible = false;				
					increaseScore();
				}
			}
		});
	});

	// Hit bottom wall - Lose
	if(ball.y + ball.size > canvas.height) {
		/* every time we lose a ball:
			- decrease number of remaining lives
			- reset the score multiplier
			- play 'lost ball' sound
		*/
		livesLeft--;
		scoreMultiplier = 0;
		if (gameActive === true) {lostBallAudio.play()};

		 // if we have remaining lives, reset ball position and keep going
		if (livesLeft > 0) {
			startingPosition();
		// Otherwise, end game and display losing screen
		} else if (livesLeft === 0) { 
			endGame('lose');	
		}		
	}
}

// GAME: MECHANICS: End
function endGame(result, manualScore) {
	startingPosition(); // reset ball & paddle position, or the ball will keep bouncing behind our you won/you lost screen :)
	gameActive = false; // this is basically to enable/disable
	
	// Depending on if we've lost or won the game, show winning/losing screen and play the right sound
	// Also we focus on the 'play again' button, so it also reacts to us pressing enter
	if (result === 'lose') {	
		lostGame.classList.add('show');
		youloseAudio.play();
		lostGameBtn.focus();
	}
	if (result === 'win') {
		wonGame.classList.add('show');
		youwinAudio.play();
		wonGameBtn.focus();
	}
	
	// Print out our final score.
	/* NOTE: the 'manualScore' parameter is used only to add, symbolically, 
	   a 72 point score (one point per brick) if we end the game using the cheat key.
	   Right now it doesn't make much sense, but it's a feature I plan to keep
	   if I manage to add extra screens in the future, so you can easily skip from one
	   to the next ;)
	*/
	for (i = 0; i < finalScore.length; i++) {
		manualScore ? score = manualScore : score = score;
		finalScore[i].innerHTML = `Your Score: ${score}`;
	}
	
}

// GAME: MECHANICS: Start New Round
// Start of each Round (after a ball is lost)
function startingPosition() {
	// reset the ball position
	ball.x = canvas.width / 2;
	ball.y = canvas.height - paddle.h + - 20;
	// reset the paddle position
	paddle.x = canvas.width / 2 - 40;
	// set the game as not started until you press space or up arrow
	ball.dx = 0;
	ball.dy = 0;
	// reset score multiplier
	scoreMultiplier = 0;
}

// GAME: MECHANICS: Increase Score
// Increase Score, taking into account the current score multiplier value
function increaseScore() {
	score = score + (1 * scoreMultiplier);
}

// GAME: Draw Everything
function draw() {
	// clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	drawBall(ballColor);
	drawPaddle(paddleLength);
	drawScore();
	drawLives();
	drawBricks();
}

// GAME: Update canvas drawing and animation
function update() {
	movePaddle();
	moveBall();

	// Draw Everything
	draw();

	// if ball is moving, keep increasing its movement speed
	if(ball.dx !==0 && ball.dy !==0) {
		ball.speed += 0.002;
		paddle.speed += 0.002;
	}

	// keep updating canvas and animation as long as game is active
	if (gameActive === true) { requestAnimationFrame(update); }

	// keep checking if there are any remaining visible bricks. 
	// When all bricks are gone, it means that we've won the game.
	if (bricks.every(column => column.every(brick => brick.visible === false))) {
		endGame('win');
	};
}

// GAME: INIT
// Initialize ball position. If we do this, it will not move until we start the game
ball.dx = 0;
ball.dy = 0;
// Set the default value for the score multiplier
scoreMultiplier = 0;
update();

// EVENTS: keyDown
function keyDown(e) {
	// Move paddle when using left and right arrow keys
	if(e.key === 'Right' || e.key === 'ArrowRight') {
		paddle.dx = paddle.speed;
	} else if(e.key === 'left' || e.key === 'ArrowLeft') {
		paddle.dx = -paddle.speed;
	} 

	// Start game / launch ball
	if((e.code === 'Space' || e.key === 'up' || e.key === 'ArrowUp') && gameActive === true) {
		ball.dx = 5;
		ball.dy = -5;
	} 

	// Enable/Disable the iron ball cheat
	if(e.key === 'i' || e.key === 'I') {
		if (ironBallCheat === false) {
			ironBallCheat = true;
			ballColor = 'lime';
			drawBall(ballColor);		
		} else {
			ironBallCheat = false;
			ballColor = '#eee';
			drawBall(ballColor);
		}
	}
}

// EVENTS: keyUp
function keyUp(e) {
	// stop moving paddle when releasing directional arrows
	if(
		e.key === 'Right' || 
		e.key === 'ArrowRight' || 
		e.key === 'Left' || 
		e.key === 'ArrowLeft') 
		{
			paddle.dx = 0;
		}
	
	/*
	// quickly end game (for testing purposes):
	if(e.key === '1') {
		endGame('win', 72);
	}
	
	if(e.key === '2') {
		endGame('lose');
	}
	*/
}

// EVENT HANDLERS: Keyboard
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// EVENT HANDLERS: Button
// Rules and Credits event handlers (open/close)
rulesBtn.addEventListener('click', () => rules.classList.toggle('show'));
closeRulesBtn.addEventListener('click', () => rules.classList.toggle('show'));
creditsBtn.addEventListener('click', () => credits.classList.toggle('show'));
closeCreditsBtn.addEventListener('click', () => credits.classList.toggle('show'));

// Start new game by clicking on the 'Play Again' button after either winning or losing
lostGameBtn.addEventListener("click", function() {
	window.location = window.location.href;
});
wonGameBtn.addEventListener("click", function() {
	window.location = window.location.href;
});