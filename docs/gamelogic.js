const FPS = 60;
var SHIP_SIZE = 35; //ship height in pixels
const SHIP_EXPLODE_DUR = 0.4; //duration of the ships explosion
const LASER_DIST = 0.5; //max distance laser can travel as fraction of screen width
const LASER_EXPLODE_DUR = 0.1; //duration of lasers' explosion in seconds
const SHIP_INV_DUR = 3; //duration of the ships invisibility secs
const SHIP_BLINK_DUR = 0.1; //duration of the ships blink in seconds
const TURN_SPEED = 360; //turn speed in deg per sec
const SHIP_THRUST = 5; //accelration in pixels per sec
const FRICTION = 0.7; //friction coeffucient of space (0= no fricton = lots of friction)
const ROID_NUM = getRandomArbitrary(4, 6); // starting number of asteroids
const ROIDS_JAG = 0.4; //the jaggedness of the asteroid (0= none 1=very jagged)
const LASER_MAX = 4; //Max number of laser on the screen
const LASER_SPD = 900; //speed of the lasers in pixels per second
const ROID_SPD = 70; //max starting speed
var ROID_SIZE = 120; //starting size of Roid
const ROIDS_VERT = 10; //average number of vert on a asteroid
const SHOW_DEV = false; //show or hide the dev stuf
const SHOW_CENTER_DOT = false; // show or hide the ship's center dot
const SCRAP_DUR = 0.05; //Duration the scrap will be put on screen
const L_AST_POINTS = 20; //points awarded when you destroy a large asteroid
const M_AST_POINTS = 50; //points awarded when you destroy a medium asteroid
const S_AST_POINTS = 100; //points awarded when you destroy small asteroid
const STARTING_LIVES = 3; //number of lives given at the start
const SCORE_X = 10; //offset of the score in pixels
const SCORE_Y = 30; //offset of the score in pixels
const LIVES_Y = 53; //offset of the livel in pixels
const ADD_LIVE = 10000; //starting score to add a new live for the player
const MENU_BLINK_DUR = 0.6; //duration of the blink in the main menu in seconds

/** @type {HTMLCanvasElement} */
canv = document.getElementById("gameCanvas");
ctx = canv.getContext("2d");
var bigScreen = {
  width: 0,
  height: 0,
  scale: 1.0
};
initialize();

function initialize() {
  // Register an event listener to call the resizeCanvas() function
  // each time the window is resized.
  window.addEventListener("resize", resizeCanvas, false);
  // Draw canvas border for the first time.
  resizeCanvas();
}
function resizeCanvas() {
  canv.width = window.innerWidth;
  canv.height = (window.innerHeight * 29) / 30;
  getResolution();
  //  bigScreen.scale = getScale();
  //   SHIP_SIZE *= bigScreen.scale;
  //  ROID_SIZE *= bigScreen.scale;
}

function getResolution() {
  bigScreen.width = window.screen.width * window.devicePixelRatio;
  bigScreen.height = window.screen.height * window.devicePixelRatio;
}
function getScale() {
  return (
    Math.pow(bigScreen.width / canv.width, 0.5) *
    Math.pow(bigScreen.height / canv.height, 0.5)
  );
}

//--Setup--//
var ship;
var temp = 0; //temp veriable until I implement highscores
var highscore = false; //temp variable until actual high scores is implemented
var roids = [];
if (localStorage.getItem("scores") == null) {
  scores = {
    h1: { name: "AAA", score: 10000 },
    h2: { name: null, score: null },
    h3: { name: null, score: null },
    h4: { name: null, score: null },
    h5: { name: null, score: null },
    h6: { name: null, score: null },
    h7: { name: null, score: null },
    h8: { name: null, score: null },
    h9: { name: null, score: null },
    h10: { name: null, score: null }
  };
  localStorage.setItem("scores", JSON.stringify(scores));
}
var game = newGame();
game.mainMenu.on = true;
//set up a new game
function newGame() {
  ship = newship();

  roids.splice(0, roids.length);
  createAsteroidBelt(ROID_NUM);
  var score = localStorage.getItem("scores");
  var parsed = JSON.parse(score);
  var hscore = parsed.h1.score;

  return {
    score: 0,
    highscore: hscore,
    lives: STARTING_LIVES,
    gameover: {
      on: false,
      name: "AAA",
      pos: 0
    },
    level: 1,
    newLevel: false,
    paused: {
      on: false,
      choice: 1,
      exit: false
    },
    controls: {
      thrust: ["up", 38],
      leftRot: ["left", 37],
      rightRot: ["right", 39],
      shoot: ["space", 32],
      pause: ["P", 80]
    },
    mainMenu: {
      on: false,
      choice: 1,
      blinkTime: Math.ceil(MENU_BLINK_DUR * FPS),
      blinkOn: true,
      subMenu: false
    },
    controlMenu: {
      on: false
    },
    highscoreMenu: {
      on: false
    },
    newLife: ADD_LIVE,
    devMode: SHOW_DEV
  };
}

//set up scrap array
var scrap = [];
//start score at 0 and set starting lives

//set up event handler
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

//explode the ship
function explodeShip() {
  game.lives--;
  shipExplosion();
  if (game.lives <= 0) {
    //starts the game over sequence
    game.gameover.on = true;
  }
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}
//handles updating the local and global highscores for the game
function handleHighscore(name) {
  var finalScore = game.score;
  var ret = localStorage.getItem("scores");
  var scores = JSON.parse(ret);
  var newhighscore = false;
  var tempscore = scores["h1"].score;
  var tempName = scores["h1"].name;
  const xhr = new XMLHttpRequest();
  var toSend = {
    name : name,
    score : game.score}
  toSend = JSON.stringify(toSend)
  xhr.open('POST','https://localhost:5001/api/scores', true);
  xhr.withCredentials = true;
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(toSend);
  for (var i = 1; i <= Object.keys(scores).length; i++) {
    var pos = "h" + i;
    if (scores[pos].score == null && tempscore != null && !newhighscore) {
      tempscore = null;
      tempName = null;
      scores[pos].score = finalScore;
      scores[pos].name = name;
      newhighscore = true;
      continue;
    } else if (scores[pos].score < finalScore && !newhighscore) {
      tempscore = scores[pos].score;
      tempName = scores[pos].name;

      scores[pos].score = finalScore;
      scores[pos].name = name;
      newhighscore = true;
      continue;
    }
    if (newhighscore && tempscore != null) {
      var temp2scr = scores[pos].score;
      var temp3nme = scores[pos].name;
      scores[pos].score = tempscore;
      scores[pos].name = tempName;
      tempscore = temp2scr;
      tempName = temp3nme;
    }
  }
  localStorage.setItem("scores", JSON.stringify(scores));
}

function changeChar(increase, character) {
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-^*";

  for (var i = 0; i < alphabet.length; i++) {
    if (character == alphabet.charAt(i)) {
      if (increase) {
        if (i < alphabet.length - 1) {
          return alphabet.charAt(i + 1);
        } else {
          return alphabet.charAt(0);
        }
      } else {
        if (i > 0) {
          return alphabet.charAt(i - 1);
        } else {
          return alphabet.charAt(alphabet.length - 1);
        }
      }
    }
  }
}
//explode ship nicely
function shipExplosion() {}

function keyDown(/** @type {KeyboardEvent} */ ev) {
  switch (ev.keyCode) {
    case game.controls.thrust[1]: //up arrow (thrust the ship forward)
      if (!game.paused.on) {
        ship.thrusting = true;
      }
      if (game.gameover.on) {
        var name = game.gameover.name.split("");
        var c = changeChar(true, game.gameover.name.charAt(game.gameover.pos));
        name[game.gameover.pos] = c;
        game.gameover.name = name.join("");
      }
      break;
    case game.controls.rightRot[1]: //right arrow (rotate the ship right)
      if (!game.paused.on) {
        ship.rot = ((-TURN_SPEED / 180) * Math.PI) / FPS;
      }
      if (game.gameover.on) {
        if (game.gameover.pos >= 2) {
          game.gameover.pos = 0;
        } else {
          game.gameover.pos++;
        }
      }
      break;
    case game.controls.shoot[1]: //space bar (shoot lasers PEW PEW)
      if (!game.gameover.on && !game.paused.on) {
        shootLaser();
      }
      break;
    case game.controls.leftRot[1]: //left arrow (rotate ship left)
      if (!game.paused.on) {
        ship.rot = ((TURN_SPEED / 180) * Math.PI) / FPS;
      }
      if (game.gameover.on) {
        if (game.gameover.pos <= 0) {
          game.gameover.pos = 2;
        } else {
          game.gameover.pos--;
        }
      }
      break;
    case game.controls.pause[1]: //pause the game
      if (!game.gameover.on && !game.mainMenu.on) {
        game.paused.on = !game.paused.on ? true : false;
        game.paused.exit = false;
      }
      break;
    case 57: //number 9
      game.devMode = !game.devMode ? true : false;
      break;
    case 40: //down key
      if (game.gameover.on) {
        var name = game.gameover.name.split("");
        var c = changeChar(false, game.gameover.name.charAt(game.gameover.pos));
        name[game.gameover.pos] = c;
        game.gameover.name = name.join("");
      }
  }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
  switch (ev.keyCode) {
    case 38: //up arrow (stop thrust the ship forward)
      if (!game.paused.on && !game.mainMenu.on) {
        ship.thrusting = false;
      } else if (game.mainMenu.on) {
        game.mainMenu.choice--;
        if (game.mainMenu.choice <= 0) {
          game.mainMenu.choice = 3;
        }
      }
      break;
    case 40:
      if (game.mainMenu.on) {
        game.mainMenu.choice++;
        if (game.mainMenu.choice > 3) {
          game.mainMenu.choice = 1;
        }
      }
      break;

    case 39: //right arrow (stop rotate the ship right)
      if (!game.paused.on) {
        ship.rot = 0;
      } else if (game.paused.exit) {
        game.paused.choice = game.paused.choice == 1 ? 2 : 1;
      }
      break;
    case 32: //space bar (allow shooting)
      if (!game.gameover.on && !game.paused.on) {
        ship.canShoot = true;
      }
      break;
    case 13: //enter button start a new game if at game over
      if (game.gameover.on) {
        handleHighscore(game.gameover.name);
        game = newGame();
      }
      if (game.mainMenu.on) {
        //enter a choice if the main menu is on
        switch (game.mainMenu.choice) {
          case 1:
            game.mainMenu.on = false;
            ship = newship();
            break;
          case 2:
            game.mainMenu.subMenu = true;
            game.controlMenu.on = true;
            break;
          case 3:
            game.highscoreMenu.on = true;
            game.mainMenu.subMenu = true;
            break;
        }
      }
      if (game.paused.on && game.paused.exit) {
        switch (game.paused.choice) {
          case 1:
            game.paused.exit = false;
            break;
          case 2:
            game = newGame();
            game.mainMenu.on = true;
        }
      }
    case 37: //left arrow ( stop rotate ship left)
      ship.rot = 0;
      break;
    case 27: // esc button
      if (game.paused.on) {
        game.paused.exit = !game.paused.exit ? true : false;
      } else if (game.mainMenu.subMenu && game.controlMenu.on) {
        game.mainMenu.subMenu = false;
        game.controlMenu.on = false;
      } else if (game.mainMenu.subMenu && game.highscoreMenu.on) {
        game.mainMenu.subMenu = false;
        game.highscoreMenu.on = false;
      } else if (game.gameover.on) {
        handleHighscore(game.gameover.name);
        game.gameover.on = false;
        game.mainMenu.on = true;
      }
      break;
  }
}
//set up the game loop
setInterval(update, 1000 / FPS);

//change the level of the game
function changelevel() {
  game.level += 1;
  ship = newship();
  createAsteroidBelt(ROID_NUM + getRandomArbitrary(game.level, game.level + 3));
  game.newLevel = true;
}

function createAsteroidBelt(number) {
  roids = [];
  var x, y;

  for (var i = 0; i < number; i++) {
    do {
      x = Math.floor(Math.random() * canv.width);
      y = Math.floor(Math.random() * canv.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROID_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 2), "l"));
  }
}

function destroyAsteroid(index) {
  var x = roids[index].x;
  var y = roids[index].y;
  var r = roids[index].r;
  game.score += roids[index].pv;
  if (game.score > game.highscore) {
    game.highscore = game.score;
  }
  checkAddLife();

  if (r == Math.ceil(ROID_SIZE / 2)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4), "m"));
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4), "m"));
  } else if (r == Math.ceil(ROID_SIZE / 4)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8), "s"));
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8), "s"));
  }
  explodeScrap(index);
  //destroy the original asteroid
  roids.splice(index, 1);
  if (roids.length == 0) {
    changelevel();
  }
}

//if score hits 10000 award the player with a new live---also start the second part ;)
function checkAddLife() {
  if (game.score >= game.newLife) {
    game.lives++;
    game.newLife += ADD_LIVE;

    //TODO add in hard start
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function newAsteroid(x, y, r, s) {
  var speed;
  var points;
  switch (s) {
    case "l":
      speed = ROID_SPD;
      points = L_AST_POINTS;
      break;
    case "m":
      speed = ROID_SPD * 2;
      points = M_AST_POINTS;
      break;
    case "s":
      speed = ROID_SPD * 3;
      points = S_AST_POINTS;
      break;
  }

  var roid = {
    x: x,
    y: y,
    xv: ((Math.random() * speed) / FPS) * (Math.random() < 0.5 ? 1 : -1),
    yv: ((Math.random() * speed) / FPS) * (Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2, // in rads
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
    offset: [],
    pv: points
  };
  //create the vertex offset array
  for (var i = 0; i < roid.vert; i++) {
    roid.offset.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
  }
  return roid;
}

function newship() {
  return {
    x: canv.width / 2,
    y: canv.height / 2,
    r: SHIP_SIZE / 2, //radius of the ship
    a: (90 / 180) * Math.PI, //convert degrees to radians
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    canShoot: true,
    lasers: [],
    explodeShip: 0,
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0
    }
  };
}

function shootLaser() {
  //create the laser object
  if (ship.canShoot && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      //from nose of ship
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
      yv: (-LASER_SPD * Math.sin(ship.a)) / FPS,
      dist: 0
    });
  }
  //prevent further shooting
  ship.canShoot = false;
}

function explodeScrap(index) {
  for (var i = 0; i < getRandomArbitrary(5, 15); i++) {
    var angle = Math.random() * (Math.PI * 2);

    scrap.push({
      x: roids[index].x,
      y: roids[index].y,
      xv:
        ((Math.random() * ROID_SPD * 4) / FPS) * (Math.random() < 0.5 ? 1 : -1),
      yv:
        ((Math.random() * ROID_SPD * 4) / FPS) * (Math.random() < 0.5 ? 1 : -1),
      dist: 0
    });
  }
}

function displaykeyboardkey(char, size, x, y) {
  ctx.font = size + "px Hyperspace";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(char, x, y);
}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
/**
 *
 * !begin the game loop
 */
function update() {
  var blinkOn = ship.blinkNum % 2 == 0;
  var exploding = ship.explodeTime > 0;

  //set background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canv.width, canv.height);
  game.mainMenu.blinkTime--;
  //reduce blink num
  if (game.mainMenu.blinkTime == 0) {
    game.mainMenu.blinkTime = Math.ceil(MENU_BLINK_DUR * FPS);
    game.mainMenu.blinkOn = game.mainMenu.blinkOn ? false : true;
  }
  if (game.mainMenu.on) {
    //!load main menu

    if (!game.mainMenu.subMenu) {
      //draw main title
      ctx.font = "80px Hyperspace";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("Asteroids.js", canv.width / 2, (canv.height * 3) / 8);
      ctx.font = "30px Hyperspace";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      if (!game.mainMenu.blinkOn && game.mainMenu.choice == 1) {
      } else {
        ctx.fillText("Start New Game", canv.width / 2, (canv.height * 3) / 5);
      }
      if (!game.mainMenu.blinkOn && game.mainMenu.choice == 2) {
      } else {
        ctx.fillText("Controls", canv.width / 2, (canv.height * 3) / 5 + 40);
      }
      if (!game.mainMenu.blinkOn && game.mainMenu.choice == 3) {
      } else {
        ctx.fillText("high scores", canv.width / 2, (canv.height * 3) / 5 + 80);
      }
      if (highscore) {
        ctx.fillText(
          "I haven't done highscores yet chill out",
          canv.width / 2,
          (canv.height * 4) / 5
        );
        temp++;
        if (temp > 1700) {
          temp = 0;
          highscore = false;
        }
      }
    } else if (game.controlMenu.on) {
      //!draw the controls menu
      //draw main title
      ctx.font = "80px Hyperspace";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("Controls", canv.width / 2, (canv.height * 1) / 8);
      //displaykeyboardkey("up",30, canv.width *1/3, canv.height * 3/8);
      ctx.font = "30px Hyperspace";
      ctx.fillStyle = "white";
      ctx.textAlign = "left";
      ctx.fillText(
        "Activate Thrust: UP arrow",
        (canv.width * 1) / 4,
        (canv.height * 6) / 16
      );
      ctx.fillText(
        "Rotate ship left: left arrow",
        (canv.width * 1) / 4,
        (canv.height * 7) / 16
      );
      ctx.fillText(
        "Rotate ship Right: Right arrow",
        (canv.width * 1) / 4,
        (canv.height * 8) / 16
      );
      ctx.fillText(
        "shoot ship lasers: space",
        (canv.width * 1) / 4,
        (canv.height * 9) / 16
      );
      ctx.fillText(
        "Pause the Game: P",
        (canv.width * 1) / 4,
        (canv.height * 10) / 16
      );
      ctx.font = "20px Hyperspace";
      ctx.textAlign = "center";

      ctx.fillText(
        "Press esc to go back to the main menu",
        (canv.width * 1) / 2,
        (canv.height * 13) / 16
      );

    } else if (game.highscoreMenu.on) { //main menu highscores
      //
      ctx.font = "80px Hyperspace";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("Highscores", canv.width / 2, (canv.height * 1) / 8);
      ctx.font = "45px Hyperspace-bold";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("Local Highscores",canv.width * 1/3, canv.height* 2/8);
      ctx.fillText("Global Highscores", canv.width * 2/3, canv.height * 2/8);

      var ret = localStorage.getItem("scores");
      var locscores = JSON.parse(ret);
var i = canv.height * 4/12
      for(var j = 1; j <= Object.keys(locscores).length; j++){
        if(locscores['h'+j].score != null){
          i += 55
          ctx.fillText(locscores['h'+j].name + "\t" + locscores['h'+j].score, canv.width * 1/3, i)
        }
      };

    }
  }

  //! start game
  //thrust the ship
  if (!game.gameover.on && !game.mainMenu.on) {
    if (ship.thrusting) {
      ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
      ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;

      // draw the thruster
      if (!exploding && blinkOn) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = SHIP_SIZE / 30;
        ctx.beginPath();
        ctx.moveTo(
          // rear left
          ship.x -
            ship.r * ((2 / 3) * Math.cos(ship.a) + 0.2 * Math.sin(ship.a)),
          ship.y +
            ship.r * ((2 / 3) * Math.sin(ship.a) - 0.2 * Math.cos(ship.a))
        );
        ctx.lineTo(
          // rear centre (behind the ship)
          ship.x - ((ship.r * 4) / 3) * Math.cos(ship.a),
          ship.y + ((ship.r * 4) / 3) * Math.sin(ship.a)
        );
        ctx.lineTo(
          // rear right
          ship.x -
            ship.r * ((2 / 3) * Math.cos(ship.a) - 0.2 * Math.sin(ship.a)),
          ship.y +
            ship.r * ((2 / 3) * Math.sin(ship.a) + 0.2 * Math.cos(ship.a))
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
      ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
    }
  }
  //drow triangular ship
  if (!game.gameover.on && !game.mainMenu.on) {
    if (!exploding) {
      if (blinkOn) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = SHIP_SIZE / 30;
        ctx.beginPath();
        ctx.moveTo(
          //nose of the ship
          ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
          ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
        );
        ctx.lineTo(
          //rear left
          ship.x - ship.r * ((4 / 6) * Math.cos(ship.a) + Math.sin(ship.a)),
          ship.y + ship.r * ((4 / 6) * Math.sin(ship.a) - Math.cos(ship.a))
        );
        ctx.lineTo(
          //rear Right
          ship.x - ship.r * ((4 / 6) * Math.cos(ship.a) - Math.sin(ship.a)),
          ship.y + ship.r * ((4 / 6) * Math.sin(ship.a) + Math.cos(ship.a))
        );
        ctx.closePath();
        ctx.stroke();
      }

      //handle blinking
      if (ship.blinkNum > 0) {
        //reduce the blink time
        ship.blinkTime--;
        //reduce blink num
        if (ship.blinkTime == 0) {
          ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
          if (!game.paused.on) {
            ship.blinkNum--;
          }
        }
      }
    } else {
      //draw explosion
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.5, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.2, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 0.9, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 0.6, 0, Math.PI * 2, false);
      ctx.fill();
    }
  }
  if (game.devMode) {
    ctx.strokeStyle = "lime";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
    ctx.stroke();
  }

  //draw the asteroids
  if (!game.mainMenu.subMenu) {
    var x, y, r, a, vert, offset;
    for (var i = 0; i < roids.length; i++) {
      ctx.strokeStyle = "slategrey";
      ctx.lineWidth = SHIP_SIZE / 30;
      //get asteroids props
      x = roids[i].x;
      y = roids[i].y;
      r = roids[i].r;
      a = roids[i].a;
      vert = roids[i].vert;
      offset = roids[i].offset;
      //draw a path
      ctx.beginPath();
      ctx.moveTo(
        x + r * offset[0] * Math.cos(a),
        y + r * offset[0] * Math.sin(a)
      );

      //draw the polygon
      for (var j = 1; j < vert; j++) {
        ctx.lineTo(
          x + r * offset[j] * Math.cos(a + (j * Math.PI * 2) / vert),
          y + r * offset[j] * Math.sin(a + (j * Math.PI * 2) / vert)
        );
      }
      ctx.closePath();
      ctx.stroke();

      if (game.devMode) {
        ctx.strokeStyle = "lime";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, false);
        ctx.stroke();
      }
    }
  }
  if (!game.gameover.on && !game.mainMenu.on) {
    //draw the score
    ctx.font = "25px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText(game.score, 12, 35);

    //draw the number of lives
    ctx.font = "12px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText("Lives:" + game.lives, 12, 55);

    //draw the highscore
    ctx.font = "25px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText("Highscore: " + game.highscore, (canv.width * 5) / 7, 35);
  } else if (!game.mainMenu.on) {
    ctx.font = "30px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canv.width / 2, canv.height / 2);

    ctx.font = "20px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      "Your final score is: " + game.score,
      canv.width / 2,
      canv.height / 2 + 30
    );
    if (!game.mainMenu.blinkOn && game.gameover.pos == 0) {
    } else {
      ctx.font = "35px Hyperspace-bold";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(
        "" + game.gameover.name.charAt(0),
        canv.width / 2 - 25,
        canv.height / 2 + 70
      );
    }
    if (!game.mainMenu.blinkOn && game.gameover.pos == 1) {
    } else {
      ctx.font = "35px Hyperspace-bold";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(
        "" + game.gameover.name.charAt(1),
        canv.width / 2,
        canv.height / 2 + 70
      );
    }
    if (!game.mainMenu.blinkOn && game.gameover.pos == 2) {
    } else {
      ctx.font = "35px Hyperspace-bold";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(
        "" + game.gameover.name.charAt(2),
        canv.width / 2 + 25,
        canv.height / 2 + 70
      );
    }
    ctx.font = "15px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      "Press enter to start a new game",
      canv.width / 2,
      canv.height / 2 + 100
    );
    ctx.fillText(
      "Press esc to return to the main menu",
      canv.width / 2,
      canv.height / 2 + 125
    );
  }
  if (game.paused.on && game.mainMenu.blinkOn && !game.paused.exit) {
    ctx.font = "30px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Game Paused", canv.width / 2, canv.height / 2 + 60);
  }
  if (game.paused.on && !game.paused.exit) {
    ctx.font = "15px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      "Press esc to return to the main menu",
      canv.width / 2,
      canv.height / 2 + 90
    );
    ctx.font = "15px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Press P to Resume", canv.width / 2, canv.height / 2 + 115);
  }
  if (game.paused.on && game.paused.exit) {
    ctx.font = "20px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      "Do you really want to return to the main menu?",
      canv.width / 2,
      canv.height / 2 + 60
    );
    if (game.paused.choice == 1 && !game.mainMenu.blinkOn) {
    } else {
      ctx.font = "20px Hyperspace-bold";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("<no>", canv.width / 2 - 110, canv.height / 2 + 110);
    }
    if (game.paused.choice == 2 && !game.mainMenu.blinkOn) {
    } else {
      ctx.font = "20px Hyperspace-bold";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("<yes>", canv.width / 2 + 110, canv.height / 2 + 110);
    }
  }
  if (game.newLevel && blinkOn && !game.gameover.on) {
    ctx.font = "30px Hyperspace-bold";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      "Level " + game.level + " start",
      canv.width / 2,
      canv.height / 2 + 60
    );
  }
  if (ship.blinkNum == 0) {
    game.newLevel = false;
  }
  //center dot for debugging
  if (game.devMode) {
    ctx.fillStyle = "red";
    ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
  }
  //draw the lasers
  for (var i = 0; i < ship.lasers.length; i++) {
    (ctx.fillStyle = "white"), ctx.beginPath();
    ctx.arc(
      ship.lasers[i].x,
      ship.lasers[i].y,
      SHIP_SIZE / 24,
      0,
      Math.PI * 2,
      false
    );
    ctx.fill();
  }
  //draw scrap
  if (scrap.length > 0) {
    for (var i = scrap.length - 1; i >= 0; i--) {
      if (scrap[i].dist <= SCRAP_DUR * canv.width) {
        (ctx.strokeStyle = "slategrey"), ctx.beginPath();
        ctx.arc(scrap[i].x, scrap[i].y, SHIP_SIZE / 30, 0, Math.PI * 2, false);
        ctx.stroke();
      } else {
        //else remove the scrap from the screen
        scrap.splice(i, 1);
      }
    }
  }
  if (!game.paused.on) {
    //detect laser hits on asteroids
    var ax, ay, ar, x, ly;
    for (var i = roids.length - 1; i >= 0; i--) {
      //grab the astroids properties
      ax = roids[i].x;
      ay = roids[i].y;
      ar = roids[i].r;

      //loop over the lasers
      for (var j = ship.lasers.length - 1; j >= 0; j--) {
        //grab laser properties
        lx = ship.lasers[j].x;
        ly = ship.lasers[j].y;

        //detect hits
        if (distBetweenPoints(ax, ay, lx, ly) < ar) {
          //remove laser
          ship.lasers.splice(j, 1);

          //remove the asteroids
          destroyAsteroid(i);
          break;
        }
      }
    }

    //check for asteroids collisions
    if (!exploding) {
      //only check when not blinking
      if (ship.blinkNum == 0) {
        for (var i = 0; i < roids.length; i++) {
          if (
            distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
            ship.r + roids[i].r
          ) {
            explodeShip();
            destroyAsteroid(i);
            break;
          }
        }
      }
      //rotate ship
      ship.a += ship.rot;

      //move the ship
      ship.x += ship.thrust.x;
      ship.y += ship.thrust.y;
    } else {
      ship.explodeTime--;

      if (ship.explodeTime == 0) {
        ship = newship();
      }
    }

    //handle edge of screen;
    if (ship.x < 0 - ship.r) {
      //for left side of screen
      ship.x = canv.width + ship.r;
    } else if (ship.x > canv.width + ship.r) {
      //for the right side of screen
      ship.x = 0 - ship.r;
    }

    if (ship.y < 0 - ship.r) {
      ship.y = canv.height + ship.r;
    } else if (ship.y > canv.height + ship.r) {
      ship.y = 0 - ship.r;
    }
    //move lasers
    for (var i = ship.lasers.length - 1; i >= 0; i--) {
      //check distance travelled
      if (
        ship.lasers[i].dist > LASER_DIST * canv.width ||
        ship.lasers[i].x < 0 ||
        ship.lasers[i].x > canv.width ||
        ship.lasers[i].y < 0 ||
        ship.lasers[i].y > canv.height
      ) {
        ship.lasers.splice(i, 1);
        continue;
      }
      //move lasers
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;
      //calculate distance traveled
      ship.lasers[i].dist += Math.sqrt(
        Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)
      );

      //handle edge of screen {bad way}
      /*  if(ship.lasers[i].x < 0){
                ship.lasers[i].x = canv.width;
            }
            else if (ship.lasers[i].x > canv.width){
                ship.lasers[i].y = 0;
            }

                 if(ship.lasers[i].y < 0){
                ship.lasers[i].y = canv.height;
            }
            else if (ship.lasers[i].y > canv.height){
                ship.lasers[i].y = 0;
            } */
    }
  }
  if (!game.paused.on) {
    //move scrap if applicable
    for (var i = 0; i < scrap.length; i++) {
      //calculate distance traveled of scrap

      scrap[i].x += scrap[i].xv;
      scrap[i].y += scrap[i].yv;

      scrap[i].dist += Math.sqrt(
        Math.pow(scrap[i].xv, 2) + Math.pow(scrap[i].yv, 2)
      );
    }
    //move the asteroid
    for (var i = 0; i < roids.length; i++) {
      roids[i].x += roids[i].xv;
      roids[i].y += roids[i].yv;
      //handle screen edge
      if (roids[i].x < 0 - roids[i].r) {
        roids[i].x = canv.width + roids[i].r;
      } else if (roids[i].x > canv.width + roids[i].r) {
        roids[i].x = 0 - roids[i].r;
      }
      if (roids[i].y < 0 - roids[i].r) {
        roids[i].y = canv.height + roids[i].r;
      } else if (roids[i].y > canv.height + roids[i].r) {
        roids[i].y = 0 - roids[i].r;
      }
    }
  }
}
