
var getUrlParameter = function getUrlParameter(sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1)),
		sURLVariables = sPageURL.split('&'),
		sParameterName,
		i;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};

var server = "http://server.getthechest.com:8080";

if (getUrlParameter("server"))
{
	server = "http://" + getUrlParameter("server") + ":8080"
	$("#chat").append("<li style='color: gold;'>Custom server: " + getUrlParameter("server") + "</li>");
}

var socket = io(server);
//var socket = io("http://192.168.1.7:8080");

function sinDegrees(angle) {
	return Math.sin(angle/180*Math.PI);
}

function cosDegrees(angle) {
	return Math.cos(angle/180*Math.PI);
}

var stage;
var queue;

var soundMuted = false;

function playSound(sound)
{
	if(!soundMuted)
		createjs.Sound.play(sound);
}

//img/snowflake.png - #41acba

function manageProgressbar(id, value, image, color)
{
	if($("#" + id).length)
	{
		if(value < 0)
		{
			$("#" + id).remove();
		}
		else
		{
			$("#" + id + "-val").css("width", value + "%");
		}
	}
	else
	{
		$("#bars").append('<div id="' + id + '" class="progressbarOuter"><img src="' + image + '"><div class="progressbar" style="border: 1px solid ' + color + ';"><div id="' + id + '-val" style="background: ' + color + '; width: ' + value + '%;"></div></div></div>');
	}
}

var xSize = 21
var ySize = 21

var players = [];
var playersBySocket = [];

var tiles = [...Array(xSize).keys()].map(i => Array(ySize));
var objects = [...Array(xSize).keys()].map(i => Array(ySize));

var collisions = []

var currentDirection = 0;

var inGame = false;

$("#settings").hide();
$("#rooms").hide();
$("#mainCanvas").hide()
$("#onlineData").html("")
$(".bigtext").html("")
$(".bigtext").hide();

socket.on("roomList", 
		function(data){
			if(!inGame)
			{
				$("#settings").show()
				$("#rooms").show()
				$("#mainCanvas").hide()
				$("#onlineData").html("")
				$(".bigtext").html("")
				$(".bigtext").hide();				
				$("#rooms").html("<table id='roomListTable'><tr><td style='text-align: center;'>Room name</td><td colspan='2'>Players</td></tr></table>")
								
				var count = 0;

				for(var room in data)
				{
					if(data[room])
					{
						count ++;

						console.log("got room: " + room)
						var state = "";
						
						if(data[room].gameover)
							state = "game over! Winner: " + data[room].gameover + "";
						else if(data[room].started)
							state = "already started";
						else if(data[room].currentPlayers >= data[room].neededPlayers)
							state = "room full";
						else
							state = "<button type='button' class='joinRoom' id='" + room + "'>Join room</button>";

						$("#roomListTable").append("<tr><td>" + room + "</td><td>" + data[room].currentPlayers + "/" + data[room].neededPlayers + "</td><td style='text-align: center;'>" + state + "</td></tr>");
					}
				}

				console.log("rooms: " + count);

				if(count <= 0)
					$("#roomListTable").append("<tr><td style='text-align: center; line-height: 1.75;' colspan='3'>There are no rooms.<br>Let's create one!</td></tr>");

			}
		}
	);
	
$("#muteSound").click(function() {
	if(!soundMuted)
	{
		soundMuted = true;
		Cookies.set("soundMuted", true);
		$("#muteSound").html("Unmute sound");
	}
	else
	{
		soundMuted = false;
		Cookies.remove("soundMuted");
		$("#muteSound").html("Mute sound");
	}
});

$("#createRoom").click(function() {
	socket.emit("createRoom", {name: $("#roomName").val(), num: parseInt($("#roomMaxPlayers").val()), player: $("#name").val()})
});

$("#rooms").on("click", "button.joinRoom",
	function (event){
		socket.emit("joinRoom", {room: $(this).attr("id"), name: $("#name").val()})
		event.preventDefault();
	});

$(".bigtext").on("click", "button.leaveRoom",
	function (event){
		socket.emit("leaveRoom")
		event.preventDefault();
	});


// 87 (W) - 38 (ARROW_UP)
// 83 (S) - 40 (ARROW_DOWN)
// 65 (A) - 37 (ARROW_LEFT)
// 68 (D) - 39 (ARROW_RIGHT)

function getTickCount()
{
	return (new Date).getTime();
}

function randomBetween(min, max)
{
	return Math.floor((Math.random() * (max-min+1)) + min);
}

var nextMove = 0;

var keyDown = 0

$("body").keyup(
	function (event){
		var key = event.which;

		if(keyDown == key)
		{
			keyDown = 0
			event.preventDefault();
		}
	});

var started = false

socket.on("gameStarted", 
	function (data){
		started = data;
	});

var arrows = []
var aiming = false

$("#message").focus(
	function()
	{
		$("#message").val("");

		if(inGame)
			socket.emit("writingChat", true);
	});

$("#message").blur(
	function()
	{
		$("#message").val("");

		if(inGame)
			socket.emit("writingChat", false);
	});

function movementKeys(event, key, aiming)
{
	if(key == 87 || key ==  38)
	{
		socket.emit("moveCharacter", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5], x: 0, y: -1}); //"up")
		handleMove({soc: socket.id, direction: {x: 0, y: -1}}); //"up")
		nextMove = getTickCount()+240;
		keyDown = key
		event.preventDefault();
	}
	else if(key == 83 || key ==  40)
	{
		socket.emit("moveCharacter", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5], x: 0, y: 1}); //"down")
		handleMove({soc: socket.id, direction: {x: 0, y: 1}}); //"down")
		nextMove = getTickCount()+240;
		keyDown = key
		event.preventDefault();
	}
	else if(key == 65 || key ==  37)
	{
		socket.emit("moveCharacter", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5], x: -1, y: 0}); //"left")
		handleMove({soc: socket.id, direction: {x: -1, y: 0}}); //"left")
		nextMove = getTickCount()+240;
		keyDown = key
		event.preventDefault();
	}
	else if(key == 68 || key ==  39)
	{
		socket.emit("moveCharacter", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5], x: 1, y: 0}); //"right")
		handleMove({soc: socket.id, direction: {x: 1, y: 0}}); //"right")
		nextMove = getTickCount()+240;
		keyDown = key
		event.preventDefault();
	}
}

$("body").keydown(
	function (event){
		var key = event.which;

		if($("#message").is(':focus'))
		{
			if(key == 13)
			{
				socket.emit("writeChat", $("#message").val())
				$("#message").blur();
			}
			else if(key == 27)
			{
				$("#message").blur();
			}
		}
		else
		{
			if(inGame && (key == 13 || key == 89 || key == 84))
			{
				$("#message").focus();
				event.preventDefault();
			}
			else if(keyDown == 0)
			{
				console.log("key event: " + key)

				if(started && !players[playersBySocket[socket.id]][9])
				{
					if(key == 32)
					{
						if(players[playersBySocket[socket.id]][6])
						{
							if(players[playersBySocket[socket.id]][7] == "cannonball" || players[playersBySocket[socket.id]][7] == "snowflake")
							{
								if(aiming)
								{
									aiming = false;
									//keyDown = key;

									stage.removeChild(arrows[0]);
									stage.removeChild(arrows[1]);
									stage.removeChild(arrows[2]);
									stage.removeChild(arrows[3]);

									event.preventDefault();
								}
								else
								{
									aiming = true;
									//keyDown = key;
									
									var xt = players[playersBySocket[socket.id]][4];
									var yt = players[playersBySocket[socket.id]][5];

									if(xt <= 19 && xt >= 1 && (yt-1) <= 19 && (yt-1) >= 1 && !(collisions[xt] && collisions[xt][(yt-1)] && collisions[xt][(yt-1)] != "pickable"))
										stage.addChild(arrows[0]);

									if((xt+1) <= 19 && (xt+1) >= 1 && yt <= 19 && yt >= 1 && !(collisions[(xt+1)] && collisions[(xt+1)][yt] && collisions[(xt+1)][yt] != "pickable"))
										stage.addChild(arrows[1]);

									if((xt-1) <= 19 && (xt-1) >= 1 && yt <= 19 && yt >= 1 && !(collisions[(xt-1)] && collisions[(xt-1)][yt] && collisions[(xt-1)][yt] != "pickable"))
										stage.addChild(arrows[2]);

									if(xt <= 19 && xt >= 1 && (yt+1) <= 19 && (yt+1) >= 1 && !(collisions[xt] && collisions[xt][(yt+1)] && collisions[xt][(yt+1)] != "pickable"))
										stage.addChild(arrows[3]);


									event.preventDefault();
								}
							}
							else
							{
								aiming = false;
								socket.emit("putDownCarrying", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5]});
								keyDown = key;
								//nextMove = getTickCount()+240;
								event.preventDefault();	
							}
						}
					}
					else
					{
						if(aiming)
						{
							if(key ==  38)
							{
								socket.emit("putDownCarrying", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5], x: 0, y: -1}); //"up")
								//nextMove = getTickCount()+240;
								keyDown = key
								aiming = false;

								stage.removeChild(arrows[0]);
								stage.removeChild(arrows[1]);
								stage.removeChild(arrows[2]);
								stage.removeChild(arrows[3]);

								console.log("shoot")

								event.preventDefault();
							}
							else if(key ==  40)
							{
								socket.emit("putDownCarrying", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5], x: 0, y: 1}); //"down")
								//nextMove = getTickCount()+240;
								keyDown = key
								aiming = false;

								stage.removeChild(arrows[0]);
								stage.removeChild(arrows[1]);
								stage.removeChild(arrows[2]);
								stage.removeChild(arrows[3]);

								console.log("shoot")

								event.preventDefault();
							}
							else if(key ==  37)
							{
								socket.emit("putDownCarrying", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5], x: -1, y: 0}); //"left")
								//nextMove = getTickCount()+240;
								keyDown = key
								aiming = false;

								stage.removeChild(arrows[0]);
								stage.removeChild(arrows[1]);
								stage.removeChild(arrows[2]);
								stage.removeChild(arrows[3]);

								console.log("shoot")

								event.preventDefault();
							}
							else if(key ==  39)
							{
								socket.emit("putDownCarrying", {px: players[playersBySocket[socket.id]][4], py: players[playersBySocket[socket.id]][5], x: 1, y: 0}); //"right")
								//nextMove = getTickCount()+240;
								keyDown = key
								aiming = false;

								stage.removeChild(arrows[0]);
								stage.removeChild(arrows[1]);
								stage.removeChild(arrows[2]);
								stage.removeChild(arrows[3]);

								console.log("shoot")

								event.preventDefault();
							}

							if( key == 87 ||
								key == 83 ||
								key == 65 ||
								key == 68)
							{
								aiming = false;

								stage.removeChild(arrows[0]);
								stage.removeChild(arrows[1]);
								stage.removeChild(arrows[2]);
								stage.removeChild(arrows[3]);

								movementKeys(event, key, aiming);
								event.preventDefault();
							}
						}
						else if(getTickCount()  > nextMove)
						{
							movementKeys(event, key, aiming);
						}
					}
				}
			}
			else
			{
				event.preventDefault();
			}
		}
	});


function resizeCanvas()
{
	var h = Math.min(window.innerHeight, window.innerWidth*0.6); //60% = 100%-20%*2(left and right side)
	
	h = Math.floor(h/32)*32
	
	$("#mainCanvas").attr("style", "height: " + h + "px;")

	if(!inGame)
	{
		$("#mainCanvas").hide()
		$("#onlineData").html("")
		$(".bigtext").html("")
		$(".bigtext").hide();	
	}

	$("#rooms").height(window.innerHeight*0.78-$("#settings").height())
}

var bitmaps = []

function init()
{
	stage = new createjs.Stage("mainCanvas");

	stage.canvas.width = xSize*32
	stage.canvas.height = ySize*32

	window.addEventListener("resize", resizeCanvas, false);
	resizeCanvas()

	queue = new createjs.LoadQueue(true);
	queue.on("complete", handleComplete, this);
	queue.on("fileload", handleFileLoad, this);

	queue.loadFile({id:"levelbase", src:"img/levelbase.png"});

	queue.loadFile({id:"player_sheet_blue", src:"img/player_sheet_blue.png"});
	queue.loadFile({id:"player_sheet_red", src:"img/player_sheet_red.png"});
	queue.loadFile({id:"player_sheet_green", src:"img/player_sheet_green.png"});
	queue.loadFile({id:"player_sheet_yellow", src:"img/player_sheet_yellow.png"});

	queue.loadFile({id:"hourglass_sheet", src:"img/hourglass_sheet.png"});
	queue.loadFile({id:"speechbubble", src:"img/speechbubble.png"});
	
	queue.loadFile({id:"bitmap:spawnkey", src:"img/spawnkey.png"});
	queue.loadFile({id:"bitmap:cannonball", src:"img/cannonball.png"});
	queue.loadFile({id:"bitmap:snowflake", src:"img/snowflake.png"});

	queue.load();

	createjs.Sound.registerSound("sounds/countdown.wav", "countdown");
	createjs.Sound.registerSound("sounds/hit.wav", "hit");
	createjs.Sound.registerSound("sounds/jump.wav", "jump");
	createjs.Sound.registerSound("sounds/pickup.wav", "pickup");

	if(Cookies.get("soundMuted"))
	{
		soundMuted = true;
		$("#muteSound").html("Unmute sound");
	}
	else
	{
		soundMuted = false;
		$("#muteSound").html("Mute sound");
	}

	if(Cookies.get("name"))
		$("#name").val(Cookies.get("name"))
}

$("#name").change(function() {
	Cookies.set("name", $("#name").val())
});	

var levelBaseSheet;
var playerSheet_blue;
var playerSheet_red;
var playerSheet_green;
var playerSheet_yellow;
var hourglassSheet;
var speechbubbleSheet;

var playerAnimations = {
	idle: [4, 7, true, 0.075],
	jump1: [0, 1, false, 0.125],
	jump2: [2, 3, "idle", 0.125],

	idle_carrying: [4+8, 7+8, true, 0.075],
	jump1_carrying: [0+8, 1+8, false, 0.125],
	jump2_carrying: [2+8, 3+8, "idle_carrying", 0.125],

	//frozen_normal: [16, 16, true, 1],
	//frozen_carry: [17, 17, true, 1],
}

function handleFileLoad(event)
{
	if(event.item.id == "levelbase")
	{
		levelBaseSheet = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 32, height: 32, regX: 0, regY: 0}, 
			animations: {}
		});
		console.log("base sheet loaded")


		var w = levelBaseSheet.getFrameBounds(0).width;
		var h = levelBaseSheet.getFrameBounds(0).height;
		
		arrows[0] = new createjs.Sprite(levelBaseSheet);
		arrows[0].gotoAndStop(51);
		arrows[0].regX = Math.floor(w/2);
		arrows[0].regY = Math.floor(h/2);

		arrows[1] = new createjs.Sprite(levelBaseSheet);
		arrows[1].gotoAndStop(52);
		arrows[1].regX = Math.floor(w/2);
		arrows[1].regY = Math.floor(h/2);

		arrows[2] = new createjs.Sprite(levelBaseSheet);
		arrows[2].gotoAndStop(50);
		arrows[2].regX = Math.floor(w/2);
		arrows[2].regY = Math.floor(h/2);

		arrows[3] = new createjs.Sprite(levelBaseSheet);
		arrows[3].gotoAndStop(53);
		arrows[3].regX = Math.floor(w/2);
		arrows[3].regY = Math.floor(h/2);

	}
	else if(event.item.id == "player_sheet_green")
	{
		playerSheet_green = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: playerAnimations,
		});
		console.log("player sheet loaded")
	}
	else if(event.item.id == "player_sheet_red")
	{
		playerSheet_red = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: playerAnimations,
		});
		console.log("player sheet loaded")
	}
	else if(event.item.id == "player_sheet_blue")
	{
		playerSheet_blue = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: playerAnimations,
		});
		console.log("player sheet loaded")
	}
	else if(event.item.id == "player_sheet_yellow")
	{
		playerSheet_yellow = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: playerAnimations,
		});
		console.log("player sheet loaded")
	}
	else if(event.item.id == "speechbubble")
	{
		speechbubbleSheet = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 32, height: 16, regX: 0, regY: 0}, 
			animations: {
				idle: [0, 3, "idle", 0.05],
			}
		});
		console.log("hourglass sheet loaded")
	}
	else if(event.item.id == "hourglass_sheet")
	{
		hourglassSheet = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 14, height: 13, regX: 0, regY: 0}, 
			animations: {
				idle: [0, 14, "idle", 0.35],
			}
		});
		console.log("hourglass sheet loaded")
	}
	else if(event.item.id.indexOf("bitmap:") == 0)
	{
		bitmaps[event.item.id.substr(7)] = event.result;
		console.log("bitmap loaded: " + event.item.id.substr(7))
	}
}

//2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20

function generateBiteInMap(y, dir, xsize, yize)
{
	if(dir == 1)
	{
		var x = 0

		for(j=x; j<=x+xsize; j++)
			tiles[j][y].gotoAndStop(27);

		tiles[x][y].gotoAndStop(31);

		for(i=y+1; i<y+yize; i++)
		{
			tiles[x][i].gotoAndStop(16);
			
			for(j=x; j<=x+xsize; j++)
				tiles[j][i].gotoAndStop(16);

			tiles[x+xsize][i].gotoAndStop(6);
		}

		for(j=x; j<=x+xsize; j++)
			tiles[j][y+yize].gotoAndStop(4);

		tiles[x][y+yize].gotoAndStop(8);

		tiles[x+xsize][y].gotoAndStop(29);		
		tiles[x+xsize][y+yize].gotoAndStop(2);		
	}
	else if(dir == 2)
	{
		var x = xSize-1

		for(j=x; j>=x-xsize; j--)
			tiles[j][y].gotoAndStop(27);

		tiles[x][y].gotoAndStop(30);

		for(i=y+1; i<y+yize; i++)
		{
			tiles[x][i].gotoAndStop(16);
			
			for(j=x; j>=x-xsize; j--)
				tiles[j][i].gotoAndStop(16);

			tiles[x-xsize][i].gotoAndStop(11);
		}

		for(j=x; j>=x-xsize; j--)
			tiles[j][y+yize].gotoAndStop(4);

		tiles[x][y+yize].gotoAndStop(12);

		tiles[x-xsize][y].gotoAndStop(28);		
		tiles[x-xsize][y+yize].gotoAndStop(3);
	}
}

var createdObjects = []

function createObjectElement(id)
{
	if(bitmaps[id])
	{
		return (new createjs.Bitmap(bitmaps[id]));
	}
	else if(id == "hourglass")
	{
		return (new createjs.Sprite(hourglassSheet, "idle"));
	}
	else
	{
		var el = (new createjs.Sprite(levelBaseSheet));

		el.gotoAndStop(id);

		return el;
	}
}

function placeObject(id, x, y)
{
	objects[x][y] = [];
	
	var index = createdObjects.push({x: x, y: y}) -1;
	objects[x][y][5] = index;
	
	if(bitmaps[id])
	{
		objects[x][y][0] = createObjectElement(id);
		
		var w = objects[x][y][0].getBounds().width
		var h = objects[x][y][0].getBounds().height
		
		objects[x][y][0].x = Math.floor(x*32 + 16 - w/2);
		objects[x][y][0].y = Math.floor(y*32 + 16 - h/2);

		stage.addChild(objects[x][y][0]);
	}	
	else if(id == "hourglass")
	{
		objects[x][y][0] = createObjectElement(id);

		var w = hourglassSheet.getFrameBounds(0).width
		var h = hourglassSheet.getFrameBounds(0).height
		
		objects[x][y][0].x = Math.floor(x*32 + 16 - w/2);
		objects[x][y][0].y = Math.floor(y*32 + 16 - h/2);;

		stage.addChild(objects[x][y][0]);
	}
	else
	{
		objects[x][y][0] = createObjectElement(id);

		objects[x][y][0].x = x*32;
		objects[x][y][0].y = y*32;

		stage.addChild(objects[x][y][0]);	
	}
	
	objects[x][y][1] = id;
	objects[x][y][2] = Math.random()*2;
	
	objects[x][y][3] = objects[x][y][0].x;
	objects[x][y][4] = objects[x][y][0].y;
}

var playersNum = 0;

function setPlayersOrders()
{
	for(var i in players)
	{
		if(players[i])
		{
			stage.setChildIndex(players[i][0], stage.getNumChildren()-1);
			
			if(players[i][6])
				stage.setChildIndex(players[i][6], stage.getNumChildren()-1);
		}
	}

	stage.setChildIndex(arrows[0], stage.getNumChildren()-1);
	stage.setChildIndex(arrows[1], stage.getNumChildren()-1);
	stage.setChildIndex(arrows[2], stage.getNumChildren()-1);
	stage.setChildIndex(arrows[3], stage.getNumChildren()-1);

	for(var i in players)
	{
		if(players[i])
		{
			stage.setChildIndex(players[i][1], stage.getNumChildren()-1);
			stage.setChildIndex(players[i][2], stage.getNumChildren()-1);
		}
	}
}

function createPlayer(id, x, y, socket, name, color)
{
	players[id] = []
	
	var sheet = playerSheet_green

	if(color == "darkcyan")
		sheet = playerSheet_blue
	else if(color == "indianred")
		sheet = playerSheet_red
	else if(color == "gold")
		sheet = playerSheet_yellow


	players[id][0] = new createjs.Sprite(sheet, "idle");
	
	
	var w = sheet.getFrameBounds(0).width;
	var h = sheet.getFrameBounds(0).height;
	
	players[id][0].regX = Math.floor(w/2);

	players[id][0].x = Math.floor(x*32 + 16);
	players[id][0].y = Math.floor(y*32 + 16 - h/2)-8;
	//players[id][0].addEventListener("animationend", playerAnimationEnd)

	console.log("create player " + name)


	players[id][2] = new createjs.Text(name, "12px 'Press Start 2P'", color);

	players[id][2].x = players[id][0].x;
	players[id][2].y = players[id][0].y-20;
	players[id][2].textAlign = "center";
		
	var text = Math.floor(players[id][2].getBounds().width/2)

	players[id][1] = new createjs.Shape();
	
	players[id][1].graphics.beginFill("rgba(0,0,0,0.65)").drawRect(0, 0, text*2+8, players[id][2].getBounds().height+2);

	players[id][1].x = players[id][0].x - text - 4;
	players[id][1].y = players[id][2].y - 2;

	players[id][3] = text

	players[id][4] = x
	players[id][5] = y

	playersBySocket[socket] = id

	stage.addChild(players[id][0]);
	stage.addChild(players[id][1]);
	stage.addChild(players[id][2]);

	setPlayersOrders()

	players[id][6] = false // carrying
	players[id][7] = false // carrying (id)
	
	players[id][8] = new createjs.Sprite(speechbubbleSheet, "idle");

	players[id][9] = false // frozen

	console.log("player created: " + id)

	return id
}

var jumpDatas = []

/*function playerAnimationEnd(event)
{
	if(event.name == "jump1")
	{
		event.currentTarget.x += jumpDatas[event.currentTarget.id][0]*32
		event.currentTarget.y += jumpDatas[event.currentTarget.id][1]*32
	}
}*/

function jumpPlayer(id, x, y)
{	
	if(players[id][6])
		players[id][0].gotoAndPlay("jump1_carrying");
	else
		players[id][0].gotoAndPlay("jump1");
	
	jumpDatas[id] = [players[id][0].x, players[id][0].y, x, y, 0]
}

function resetTiles(add)
{
	for(x=0; x<xSize; x++)
	{
		for(y=0; y<ySize; y++)
		{
			//console.log(x + ", " + y)
				
			if(objects[x][y])
			{
				stage.removeChild(objects[x][y][0])
			}
			
			if(add)
				tiles[x][y] = new createjs.Sprite(levelBaseSheet);

			if(x == xSize-1 && y == ySize-1)
				tiles[x][y].gotoAndStop(30);
			else if(x == 0 && y == 0)
				tiles[x][y].gotoAndStop(8);
			else if(x == xSize-1 && y == 0)
				tiles[x][y].gotoAndStop(12);
			else if(x == 0 && y == ySize-1)
				tiles[x][y].gotoAndStop(31);
			else if(y == ySize-1)
				tiles[x][y].gotoAndStop(27);
			else if(x == 0)
				tiles[x][y].gotoAndStop(6);
			else if(x == xSize-1)
				tiles[x][y].gotoAndStop(11);
			else if(y == 0)
				tiles[x][y].gotoAndStop(4);
			else
			{
				tiles[x][y].gotoAndStop(1);

				var rand = randomBetween(1, 85)

				//console.log(rand)

				if(rand >= 1 && rand <= 4)
				{
					tiles[x][y].gotoAndStop(35+rand);
				}
				else if(rand >= 5 && rand <= 8)
				{
					tiles[x][y].gotoAndStop(40+rand);
				}
			}

			tiles[x][y].x = x*32;
			tiles[x][y].y = y*32;
	
			if(add)
				stage.addChild(tiles[x][y]);
		}
	}
	
	
	tiles[1][1].gotoAndStop(32);
	tiles[1][19].gotoAndStop(33);
	tiles[19][19].gotoAndStop(34);
	tiles[19][1].gotoAndStop(35);

	createdObjects = []
	objects = [...Array(xSize).keys()].map(i => Array(ySize))

	for(var id in players)
	{
		stage.removeChild(players[id][0]);
		stage.removeChild(players[id][1]);
		stage.removeChild(players[id][2]);

		if(players[id][6])
			stage.removeChild(players[id][6]);
	}

	players = []
	playersNum = 0
}

function handleComplete()
{
	console.log("loaded");

	resetTiles(true);

	
	/*
	playersNum = 1;

	generateBiteInMap(2, 1, 2, 4);
	generateBiteInMap(8, 1, 3, 5);
	generateBiteInMap(15, 1, 2, 2);

	generateBiteInMap(3, 2, 1, 3);
	generateBiteInMap(8, 2, 2, 1);
	generateBiteInMap(12, 2, 1, 4);

	placeObject(26, 6, 3);
	placeObject(26, 11, 15);
	
	placeObject(24, 6, 9);//chest
	placeObject("hourglass", 11, 10);
	placeObject("cannonball", 11, 7);
	placeObject("snowflake", 11, 5);*/
	

	createjs.Ticker.framerate = 60;
	createjs.Ticker.on("tick", render);
}

socket.on("objectCreated", 
	function(data){
		placeObject(data.id, data.x, data.y)

		if(data.carrying)
		{
			var id = playersBySocket[data.carrying]
			putPlayerInCarry(id)

			setPlayersOrders()
		}
	})

function putPlayerInCarry(id, obj)
{
	if(obj)
	{
		players[id][6] = createObjectElement(obj);

		var w = players[id][6].getBounds().width;
		players[id][6].regX = Math.floor(w/2);
		players[id][6].regY = players[id][6].getBounds().height;
		
		stage.addChild(players[id][6])
		
		players[id][7] = obj
	}
	else
	{
		stage.removeChild(players[id][6])

		players[id][6] = null
		players[id][7] = null
	}

	if(players[id][6])
		players[id][0].gotoAndPlay("idle_carrying");
	else
		players[id][0].gotoAndPlay("idle");
}

socket.on("sendRoomStructure", 
	function(data){
		started = false

		$("#settings").hide();
		$("#rooms").hide();
		$("#mainCanvas").show();

		inGame = true;

		resetTiles();
		
		//struct: roomStructures[room], mySpawn: currentSpawnPoint, players: rooms[room].spawnPoints

		collisions = data.collisions;

		var structure = data.struct;
		
		for(var i in structure.bites)
		{
			if(structure.bites[i])
				generateBiteInMap(structure.bites[i].y, structure.bites[i].dir, structure.bites[i].xsize, structure.bites[i].ysize)
		}
		
		for(var i in structure.objects)
		{
			if(structure.objects[i])
				placeObject(structure.objects[i].id, structure.objects[i].x, structure.objects[i].y)
		}

		playersNum = 0;

		for(var i in data.players)
		{
			if(data.players[i])
			{

				var id = createPlayer(playersNum, data.players[i].x, data.players[i].y, data.players[i].soc, data.players[i].name, data.players[i].color);

				if(data.players[i].carrying)
					putPlayerInCarry(id, data.players[i].carrying)

				if(data.players[i].soc == socket.id)
				{
					$("#onlineData").html(data.name + "/<font color='" + data.players[i].color + "'>" + data.players[i].name + "</font>");
				}

				playersNum ++;
			}
		}

		$(".bigtext").css("font-size", "100%");
		$(".bigtext").show();
		$(".bigtext").html("Waiting for players...<br><br><button type='button' class='leaveRoom' style='width: 50%; margin: 0 auto;'>Back to menu</button>")
	});

var projectiles = []

socket.on("deleteProjectile", 
	function(data) {
		stage.removeChild(projectiles[data.id][0]);
		delete projectiles[data.id];

		if(!data.outOfRange)
			playSound("hit");
	});

socket.on("createProjectile", 
	function(data) {
		projectiles[data.id] = []
		projectiles[data.id][0] = createObjectElement(data.obj);
			
		stage.addChild(projectiles[data.id][0]);

		var w = projectiles[data.id][0].getBounds().width
		var h = projectiles[data.id][0].getBounds().height
		
		projectiles[data.id][0].x = Math.floor(data.x*32 + 16 - w/2);
		projectiles[data.id][0].y = Math.floor(data.y*32 + 16 - h/2)-8;

		projectiles[data.id][1] = data.xdir; //xdir
		projectiles[data.id][2] = data.ydir; //ydir

		if(data.carrying)
		{
			var id = playersBySocket[data.carrying]
			putPlayerInCarry(id)

			setPlayersOrders()
		}
	});

socket.on("freezePlayer", 
	function(data){
		var id = playersBySocket[data.id]
			
		//frozen_normal: [16, 16, true, 1],
		//frozen_carry: [17, 17, true, 1],

		console.log("freeze: " + data.id + ", " + data.state)

		if(data.state)
			players[id][9] = getTickCount()
		else
		{
			players[id][9] = false

			if(data.id == socket.id)
				manageProgressbar("frozen", -1, "img/snowflake.png", "#41acba");
		}

		if(data.state)
		{
			if(players[id][6])
				players[id][0].gotoAndStop(17);
			else
				players[id][0].gotoAndStop(16);
		}
		else
			players[id][0].gotoAndPlay("idle");
	});

socket.on("pickUpObject", 
	function(data){
		var x = data.x;
		var y = data.y;

		stage.removeChild(objects[x][y][0]);
		console.log("delete object: " + objects[x][y][5])
		delete createdObjects[objects[x][y][5]];
		objects[x][y] = null;

		if(data.soc)
		{
			var id = playersBySocket[data.soc];
			putPlayerInCarry(id, data.obj);
			playSound("pickup");
		}
	});

socket.on('connect', 
	function() {
		inGame = false;
		started = false;
		
		$("#settings").show();
		$("#rooms").show();
		$("#mainCanvas").hide()
		$("#onlineData").html("")
		$(".bigtext").html("")
 $(".bigtext").hide();

		$("#chat").append("<li style='color: mediumseagreen;'>Successfully connected!</li>");
		$("#chat").animate({ scrollTop: $(document).height() }, 400);
	});

socket.on('leftRoom', 
	function() {
		inGame = false;
		started = false;

		$("#settings").hide();
		$("#rooms").hide();
		$("#mainCanvas").hide()
		$("#onlineData").html("")
		$(".bigtext").html("")
 $(".bigtext").hide();
		$("#chat").append("<li style='color: indianred;'>Left room</li>");
		$("#chat").animate({ scrollTop: $(document).height() }, 400);
	});

socket.on('disconnect', 
	function() {
		inGame = false;
		started = false;

		$("#settings").hide();
		$("#rooms").hide();
		$("#mainCanvas").hide()
		$("#onlineData").html("")
		$(".bigtext").html("")
 $(".bigtext").hide();
		$("#chat").append("<li style='color: indianred;'>Connection to the server was lost!</li>");
		$("#chat").append("<li style='color: indianred;'>Trying to reconnect...</li>");
		$("#chat").animate({ scrollTop: $(document).height() }, 400);
	});

socket.on('connect_error', 
	function() {
		inGame = false;
		started = false;
		
		$("#settings").hide();
		$("#rooms").hide();
		$("#mainCanvas").hide()
		$("#onlineData").html("")
		$(".bigtext").html("")
 		$(".bigtext").hide();
		$("#chat").append("<li style='color: indianred;'>Failed to connect to server!</li>");
		$("#chat").append("<li style='color: indianred;'>Trying to reconnect...</li>");
		$("#chat").animate({ scrollTop: $(document).height() }, 400);
	});

var tmo = false;

socket.on("bigText", 
	function(data) {
		$(".bigtext").show();

		if(tmo)
			clearTimeout(tmo);

		tmo = false;

		if(data.sound)
			playSound("countdown");

		if(data.text)
		{
			$(".bigtext").html(data.text);
			$(".bigtext").css("font-size", (400*data.size)+"%");

			if(data.time)
			{
				$(".bigtext").animate({ "font-size": (200*data.size)+"%" }, data.time);
				tmo = setTimeout(function () { $(".bigtext").html(""); $(".bigtext").hide(); tmo = false; }, data.time)
			}
			else
			{
			   $(".bigtext").append("<br><button type='button' class='leaveRoom' style='width: 50%; margin: 0 auto;'>Back to menu</button>")
			}
		}
		else
		{
			$(".bigtext").html(""); $(".bigtext").hide();
		}
	});

socket.on("writingChat", 
	function(data) {
		if(data.state)
		{
			stage.addChild(players[playersBySocket[data.soc]][8]);
			players[playersBySocket[data.soc]][8].gotoAndPlay("idle");
		}
		else
			stage.removeChild(players[playersBySocket[data.soc]][8]);
	});

socket.on("chatMessage", 
	function(data) {
		$("#chat").append("<li>" + data + "</li>");
		$("#chat").animate({ scrollTop: $(document).height() }, 400);
	});

socket.on("destroyPlayer", 
	function(data){
		var id = playersBySocket[data]
		delete playersBySocket[data];

		stage.removeChild(players[id][0]);
		stage.removeChild(players[id][1]);
		stage.removeChild(players[id][2]);

		if(players[id][6])
			stage.removeChild(players[id][6]);

		delete players[id];
	});

socket.on("createPlayer", 
	function(data){
		var freePlayer = 0;
		
		for(var id=0; id<=players.length; id++)
		{
			if(!players[id])
			{
				freePlayer = id;
				break;
			}
		}

		console.log("create player: " + freePlayer)

		var id = createPlayer(freePlayer, data.x, data.y, data.soc, data.name, data.color);

		if(data.carrying)
			putPlayerInCarry(id, data.carrying)

		if(id > playersNum)
			playersNum = id
	});

function handleMove(data)
{
	var id = playersBySocket[data.soc];

	if(data.x)
	{
		players[id][4] = data.x;
		players[id][5] = data.y;
	}
	else
	{
		var dirX = data.direction.x;
		var dirY = data.direction.y;

		data.direction.x = Math.round(dirX * cosDegrees(currentDirection) - dirY * sinDegrees(currentDirection));
		data.direction.y = Math.round(dirY * cosDegrees(currentDirection) + dirX * sinDegrees(currentDirection));
	}

	console.log(data.direction);

	if((players[id][4]+data.direction.x) >= 1 && (players[id][5]+data.direction.y) >= 1 && (players[id][4]+data.direction.x) <= 19 && (players[id][5]+data.direction.y) <= 19 &&
		(!collisions[(players[id][4]+data.direction.x)] || collisions[(players[id][4]+data.direction.x)][(players[id][5]+data.direction.y)] != "nomove"))
	{
		if(data.soc == socket.id)
			playSound("jump");

		if(data.direction.x == -1)
			players[id][0].scaleX = -1;
		else if(data.direction.x == 1)
			players[id][0].scaleX = 1;
		
		players[id][0].x = players[id][4]*32+16;
		players[id][0].y = players[id][5]*32-8;

		players[id][2].x = players[id][0].x;
		players[id][2].y = players[id][0].y-20;
		players[id][1].x = players[id][0].x - players[id][3] - 4;
		players[id][1].y = players[id][2].y + 1;

		jumpPlayer(id, data.direction.x, data.direction.y);

		if(!data.x)
		{
			players[id][4] += data.direction.x;
			players[id][5] += data.direction.y;
		}
	}
}

socket.on("moveCharacter", 
	function(data){
		/*
			var movementDatas = {
				soc: socket.id,
				x: playerDatas[socket.id].x,
				y: playerDatas[socket.id].y,
				direction: direction
			}
		*/
		if(data.soc != socket.id)
		{
			handleMove(data);
			console.log("remote movement")
		}
	});

socket.on("teleportCharacter", 
	function(data){
		/*
			var movementDatas = {
				soc: socket.id,
				x: playerDatas[socket.id].x,
				y: playerDatas[socket.id].y,
				direction: direction
			}
		*/

		var id = playersBySocket[data.soc]

		jumpDatas[id] = null

		players[id][4] = data.x;
		players[id][5] = data.y;

		players[id][0].x = players[id][4]*32+16;
		players[id][0].y = players[id][5]*32-8;

		players[id][2].x = players[id][0].x;
		players[id][2].y = players[id][0].y-20;
		players[id][1].x = players[id][0].x - players[id][3] - 4;
		players[id][1].y = players[id][2].y + 1;
		
		console.log("remote correction")
	});

var FPS = 0;

var projectileSpeed = 75 //hány ms egy tile

var directionChange = false

socket.on("directionChange",
	function(data) {
		if(data)
		{
			directionChange = {
				started: getTickCount(),
				time: data.time,
			}

			currentDirection = data.direction*90
		}
		else
		{
			directionChange = false;
			$("#bars").html("");
		}
	});

var spawnLock = false;

socket.on("spawnLock",
	function(data) {
		if(data)
		{
			spawnLock = getTickCount()

			collisions[1][1] = "nomove";
			collisions[1][19] = "nomove";
			collisions[19][19] = "nomove";
			collisions[19][1] = "nomove";

			tiles[1][1].gotoAndStop(32+9);
			tiles[1][19].gotoAndStop(33+9);
			tiles[19][19].gotoAndStop(34+9);
			tiles[19][1].gotoAndStop(35+9);
		}
		else
		{
			spawnLock = false;
			manageProgressbar("spawnkey", -1, "img/spawnkey.png", "gold");

			collisions[1][1] = null;
			collisions[1][19] = null;
			collisions[19][19] = null;
			collisions[19][1] = null;

			tiles[1][1].gotoAndStop(32);
			tiles[1][19].gotoAndStop(33);
			tiles[19][19].gotoAndStop(34);
			tiles[19][1].gotoAndStop(35);
		}
	});

function render(event) {
	FPS = Math.floor(1000/event.delta)
	
	if(directionChange)
	{
		var progress = 100-((getTickCount()-directionChange.started)/directionChange.time)*100;

		if(progress < 0)
			manageProgressbar("keychange", 0, "img/key.png", "mediumseagreen");
		else
			manageProgressbar("keychange", progress, "img/key.png", "mediumseagreen");

		if(players[playersBySocket[socket.id]][9])
		{
			manageProgressbar("frozen", 100-((getTickCount()-players[playersBySocket[socket.id]][9])/5000)*100, "img/snowflake.png", "#41acba");
		}
		
		if(spawnLock)
			manageProgressbar("spawnkey", 100-((getTickCount()-spawnLock)/5000)*100, "img/spawnkey.png", "gold");
	}

	for(var i in projectiles)
	{
		if(projectiles[i])
		{
			console.log("projectile: " + i)
			projectiles[i][0].x += projectiles[i][1] * (event.delta/projectileSpeed * 32)
			projectiles[i][0].y += projectiles[i][2] * (event.delta/projectileSpeed * 32)
		}
	}

	for(var i in createdObjects)
	{
		if(createdObjects[i])
		{
			var x = createdObjects[i].x;
			var y = createdObjects[i].y;
			var obj = objects[x][y];
			
			if(obj[1] == "snowflake" || obj[1] == "cannonball" || obj[1] == "spawnkey" || obj[1] == "hourglass")
			{
				objects[x][y][2] += event.delta/500;
				
				var progress = objects[x][y][2];
				
				if(progress > 2)
				{
					objects[x][y][2] = 0;
					
					objects[x][y][0].y = objects[x][y][4];
				}
				else if(progress > 1)
				{
					progress = progress - 1;
					
					objects[x][y][0].y = objects[x][y][4]-5+5*EasingFunctions.easeInQuad(progress);
				}
				else
				{
					objects[x][y][0].y = objects[x][y][4]-5*EasingFunctions.easeOutQuad(progress);
				}
			}
		}
	}

	for(var id in players)
	{
		if(jumpDatas[id])
		{
			jumpDatas[id][4] += event.delta/120;
			
			var progress = jumpDatas[id][4];
			
			if(progress > 2)
			{
				players[id][0].x = jumpDatas[id][0]+jumpDatas[id][2]*32;
				players[id][0].y = jumpDatas[id][1]+jumpDatas[id][3]*32;
				
				jumpDatas[id] = null;
			}
			else if(progress > 1)
			{
				progress = progress-1;
				
				//console.log("p2 " + progress);
				if(players[id][0].currentAnimation != "jump2")
				{
					if(players[id][6])
						players[id][0].gotoAndPlay("jump2_carrying");
					else
						players[id][0].gotoAndPlay("jump2");
				}
				
				var xv = jumpDatas[id][2]/2;
				var yv = jumpDatas[id][3]/2;
				
				var xP = 1.75*(Math.abs(yv*0.25)*players[id][0].scaleX)
				var yP = 1.75*(-Math.abs(xv*0.5) + (yv*0.5))
				
				players[id][0].x = jumpDatas[id][0]+xv*32+xP*32;
				players[id][0].x += xv*32*progress;
				players[id][0].x -= xP*32*EasingFunctions.easeInQuint(progress);
									
				players[id][0].y = jumpDatas[id][1]+yv*32+yP*32;
				players[id][0].y += yv*32*progress;
				players[id][0].y -= yP*32*EasingFunctions.easeInQuint(progress);
			}
			else
			{
				//console.log("p1 " + progress);
				
				var xv = jumpDatas[id][2]/2;
				var yv = jumpDatas[id][3]/2;
				
				var xP = 1.75*(Math.abs(yv*0.25)*players[id][0].scaleX)
				var yP = 1.75*(-Math.abs(xv*0.5) + (yv*0.5))
				
				players[id][0].x = jumpDatas[id][0];
				players[id][0].x += xv*32*progress;
				players[id][0].x += xP*32*EasingFunctions.easeOutQuint(progress);
									
				players[id][0].y = jumpDatas[id][1];
				players[id][0].y += yv*32*progress;
				players[id][0].y += yP*32*EasingFunctions.easeOutQuint(progress);
			}
			
			players[id][0].x = Math.floor(players[id][0].x)
			players[id][0].y = Math.floor(players[id][0].y)

			players[id][2].x = players[id][0].x;
			players[id][2].y = players[id][0].y-20;
			players[id][1].x = players[id][0].x - players[id][3] - 4;
			players[id][1].y = players[id][2].y - 2;
		}

		if(players[id])
		{
			if(players[id][6])
			{
				players[id][6].x = players[id][0].x;
				players[id][6].y = players[id][0].y+20;
			}

			players[id][8].x = players[id][0].x-16;
			players[id][8].y = players[id][0].y-40;
		}
	}

	if(aiming)
	{
		var x = players[playersBySocket[socket.id]][0].x;
		var y = players[playersBySocket[socket.id]][0].y+16;

		arrows[0].x = x
		arrows[0].y = y-18

		arrows[1].x = x+18
		arrows[1].y = y

		arrows[2].x = x-18
		arrows[2].y = y

		arrows[3].x = x
		arrows[3].y = y+18
	}
	
	stage.update();
}

setInterval(
	function()
	{
		$(".fpsCounter").html(FPS + " FPS")

		socket.emit('latency', Date.now(), function(startTime) {
			var latency = Date.now() - startTime;
			$(".pingCounter").html(latency + " ms")
		});

		
	}, 500)
	

/*setInterval(
	function()
	{
		jumpPlayer(0, 1, 0)
	}, 500)*/
