var socket = io("http://server.getthechest.com:8080");
//var socket = io("http://192.168.1.7:8080");

var stage;
var queue;

var xSize = 21
var ySize = 21

var players = [];
var playersBySocket = [];

var tiles = [...Array(xSize).keys()].map(i => Array(ySize));
var objects = [...Array(xSize).keys()].map(i => Array(ySize));


var collisions = []

var inGame = false;

$("#settings").hide();
$("#rooms").hide();
$("#mainCanvas").hide()
$("#onlineData").html("")
$(".bigtext").html("")

socket.on("roomList", 
		function(data){
			if(!inGame)
			{
				$("#settings").show()
				$("#rooms").show()
				$("#mainCanvas").hide()
				$("#onlineData").html("")
				$(".bigtext").html("")
				$("#rooms").html("<br><br><br>")
				
				console.log(data)

				for(var room in data)
				{
					if(data[room])
					{
						console.log("got room: " + room)
						$("#rooms").append(room + " " + data[room].currentPlayers + "/" + data[room].neededPlayers + " ");
						
						if(data[room].started)
							$("#rooms").append("<i>already started</i><br><br>")
						else if(data[room].currentPlayers >= data[room].neededPlayers)
							$("#rooms").append("<i>room full</i><br><br>")
						else
							$("<button type='button' class='joinRoom' id='" + room + "'>Join room</button><br><br>").appendTo("#rooms");
					}
				}
			}
		}
	);
	
//TODO: doesn't allow empty name for player and room & char limit
$("#createRoom").click(function() {
	socket.emit("createRoom", {name: $("#roomName").val(), num: $("#roomMaxPlayers").val(), player: $("#name").val()})
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

$("body").keydown(
	function (event){
		var key = event.which;

		if($("#message").is(':focus'))
		{
			if(key == 13)
			{
				socket.emit("writeChat", $("#message").val())
				$("#message").val("");
				$("#message").blur();
			}
			else if(key == 27)
			{
				$("#message").val("");
				$("#message").blur();
			}
		}
		else
		{
			if(inGame && (key == 13 || key == 89 || key == 84))
			{
				$("#message").focus();
			}
			else if(keyDown == 0 && getTickCount()  > nextMove)
			{
				console.log("key event: " + key)
				
				if(started)
				{
					if(key == 32)
					{
						if(players[playersBySocket[socket.id]][6])
						{
							socket.emit("putDownCarrying")
							keyDown = key
							extMove = getTickCount()+240;
							event.preventDefault();
						}
					}
					else if(key == 87 || key ==  38)
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
			}
			else
			{
				event.preventDefault();
			}
		}
	});


function resizeCanvas()
{
	var h = Math.min(window.innerHeight, window.innerWidth);
	
	h = Math.floor(h/32)*32
	
	$("#mainCanvas").attr("style", "height: " + h + "px;")

	if(!inGame)
	{
		$("#mainCanvas").hide()
		$("#onlineData").html("")
		$(".bigtext").html("")
	}
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
	
	queue.loadFile({id:"bitmap:cannonball", src:"img/cannonball.png"});
	queue.loadFile({id:"bitmap:snowflake", src:"img/snowflake.png"});

	queue.load();
}

var levelBaseSheet;
var playerSheet_blue;
var playerSheet_red;
var playerSheet_green;
var playerSheet_yellow;
var hourglassSheet;

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
	}
	else if(event.item.id == "player_sheet_green")
	{
		playerSheet_green = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: {
				idle: [4, 7, true, 0.075],
				jump1: [0, 1, false, 0.125],
				jump2: [2, 3, "idle", 0.125],

				idle_carrying: [4+8, 7+8, true, 0.075],
				jump1_carrying: [0+8, 1+8, false, 0.125],
				jump2_carrying: [2+8, 3+8, "idle_carrying", 0.125],
			}
		});
		console.log("player sheet loaded")
	}
	else if(event.item.id == "player_sheet_red")
	{
		playerSheet_red = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: {
				idle: [4, 7, true, 0.075],
				jump1: [0, 1, false, 0.125],
				jump2: [2, 3, "idle", 0.125],

				idle_carrying: [4+8, 7+8, true, 0.075],
				jump1_carrying: [0+8, 1+8, false, 0.125],
				jump2_carrying: [2+8, 3+8, "idle_carrying", 0.125],
			}
		});
		console.log("player sheet loaded")
	}
	else if(event.item.id == "player_sheet_blue")
	{
		playerSheet_blue = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: {
				idle: [4, 7, true, 0.075],
				jump1: [0, 1, false, 0.125],
				jump2: [2, 3, "idle", 0.125],

				idle_carrying: [4+8, 7+8, true, 0.075],
				jump1_carrying: [0+8, 1+8, false, 0.125],
				jump2_carrying: [2+8, 3+8, "idle_carrying", 0.125],
			}
		});
		console.log("player sheet loaded")
	}
	else if(event.item.id == "player_sheet_yellow")
	{
		playerSheet_yellow = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: {
				idle: [4, 7, true, 0.075],
				jump1: [0, 1, false, 0.125],
				jump2: [2, 3, "idle", 0.125],

				idle_carrying: [4+8, 7+8, true, 0.075],
				jump1_carrying: [0+8, 1+8, false, 0.125],
				jump2_carrying: [2+8, 3+8, "idle_carrying", 0.125],
			}
		});
		console.log("player sheet loaded")
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
			stage.setChildIndex(players[i][1], stage.getNumChildren()-1);
			stage.setChildIndex(players[i][2], stage.getNumChildren()-1);
			
			if(players[i][6])
				stage.setChildIndex(players[i][6], stage.getNumChildren()-1);
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
	}
	else
	{
		stage.removeChild(players[id][6])

		players[id][6] = null
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
		$(".bigtext").html("Waiting for players...<br><br><button type='button' class='leaveRoom' style='width: 50%; margin: 0 auto;'>Back to menu</button>")
	});

var projectiles = []

socket.on("deleteProjectile", 
	function(data) {
		stage.removeChild(projectiles[data][0]);
		delete projectiles[data];
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


		$("#chat").append("<li style='color: mediumseagreen;'>Successfully connected to server!</li>");
		$("#chat").animate({ scrollTop: $(document).height() }, 400);
	});

socket.on('leavedRoom', 
	function() {
		inGame = false;
		started = false;

		$("#settings").hide();
		$("#rooms").hide();
		$("#mainCanvas").hide()
		$("#onlineData").html("")
		$(".bigtext").html("")

		$("#chat").append("<li style='color: indianred;'>Leaved room</li>");
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

		$("#chat").append("<li style='color: indianred;'>Failed to connect to server!</li>");
		$("#chat").append("<li style='color: indianred;'>Trying to reconnect...</li>");
		$("#chat").animate({ scrollTop: $(document).height() }, 400);
	});

var tmo = false;

socket.on("bigText", 
	function(data) {
		if(tmo)
			clearTimeout(tmo);

		tmo = false;

		if(data.text)
		{
			$(".bigtext").html(data.text);
			$(".bigtext").css("font-size", (400*data.size)+"%");

			if(data.time)
			{
				$(".bigtext").animate({ "font-size": (200*data.size)+"%" }, data.time);
				tmo = setTimeout(function () { $(".bigtext").html(""); tmo = false; }, data.time)
			}
			else
			{
			   $(".bigtext").append("<br><button type='button' class='leaveRoom' style='width: 50%; margin: 0 auto;'>Back to menu</button>")
			}
		}
		else
		{
			$(".bigtext").html("");
		}
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

	if((players[id][4]+data.direction.x) >= 1 && (players[id][5]+data.direction.y) >= 1 && (players[id][4]+data.direction.x) <= 19 && (players[id][5]+data.direction.y) <= 19 &&
		(!collisions[(players[id][4]+data.direction.x)] || collisions[(players[id][4]+data.direction.x)][(players[id][5]+data.direction.y)] != "nomove"))
	{
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

var projectileSpeed = 100 //hány ms egy tile

function render(event) {
	FPS = Math.floor(1000/event.delta)
	
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
			
			if(obj[1] == "snowflake" || obj[1] == "cannonball" || obj[1] == "hourglass")
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
				players[id][6].x = players[id][0].x
				players[id][6].y = players[id][0].y+20
			}
		}
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
