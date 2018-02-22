//var socket = io("http://127.0.0.1:8080");
var socket = io("http://192.168.204.112:8080");

socket.on("roomList", 
		function(data){
			$("#rooms").show()
			$("#rooms").html("")
			
			for(var room in data)
			{
				//console.log(data[room])
				$("#rooms").append(room + " " + data[room].currentPlayers + "/" + data[room].neededPlayers + " ");
				$("<a class='joinRoom' id='" + room + "' href='#'>Belépés</a>").appendTo("#rooms");
			}
		}
	);
	

$("#rooms").on("click", "a.joinRoom",
	function (event){
		socket.emit("joinRoom", $(this).attr("id"))
		event.preventDefault();
	});


// 87 (W) - 38 (ARROW_UP)
// 83 (S) - 40 (ARROW_DOWN)
// 65 (A) - 37 (ARROW_LEFT)
// 68 (D) - 39 (ARROW_RIGHT)

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

$("body").keydown(
	function (event){
		var key = event.which;

		if(keyDown == 0)
		{
			console.log("key event: " + key)
			
			if(key == 87 || key ==  38)
			{
				socket.emit("moveCharacter", {x: 0, y: -1}); //"up")
				keyDown = key;
				event.preventDefault();
			}
			else if(key == 83 || key ==  40)
			{
				socket.emit("moveCharacter", {x: 0, y: 1}); //"down")
				keyDown = key;
				event.preventDefault();
			}
			else if(key == 65 || key ==  37)
			{
				socket.emit("moveCharacter", {x: -1, y: 0}); //"left")
				keyDown = key;
				event.preventDefault();
			}
			else if(key == 68 || key ==  39)
			{
				socket.emit("moveCharacter", {x: 1, y: 0}); //"right")
				keyDown = key;
				event.preventDefault();
			}
		}
		else
		{
			event.preventDefault();
		}
	});

var stage;
var queue;

var xSize = 21
var ySize = 21

function resizeCanvas()
{
	var h = Math.min(window.innerHeight, window.innerWidth);
	
	h = Math.floor(h/16)*16
	
	$("#mainCanvas").attr("style", "height: " + h + "px;")
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
	queue.loadFile({id:"player_sheet", src:"img/player_sheet.png"});
	queue.loadFile({id:"hourglass_sheet", src:"img/hourglass_sheet.png"});
	
	queue.loadFile({id:"bitmap:cannonball", src:"img/cannonball.png"});
	queue.loadFile({id:"bitmap:snowflake", src:"img/snowflake.png"});

	queue.load();
}

var levelBaseSheet;
var playerSheet;
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
	else if(event.item.id == "player_sheet")
	{
		playerSheet = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 24, height: 32, regX: 0, regY: 0}, 
			animations: {
				idle: [4, 5, true, 0.05],
				jump1: [0, 1, false, 0.1],
				jump2: [2, 3, "idle", 0.1],
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

var players = [];
var playersBySocket = [];

var tiles = [...Array(xSize).keys()].map(i => Array(ySize));
var objects = [...Array(xSize).keys()].map(i => Array(ySize));

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

function placeObject(id, x, y)
{
	objects[x][y] = [];
	
	var index = createdObjects.push({x: x, y: y}) -1;
	objects[x][y][5] = index;
	
	if(bitmaps[id])
	{
		objects[x][y][0] = new createjs.Bitmap(bitmaps[id]);
		
		var w = objects[x][y][0].getBounds().width
		var h = objects[x][y][0].getBounds().height
		
		objects[x][y][0].x = Math.floor(x*32 + 16 - w/2);
		objects[x][y][0].y = Math.floor(y*32 + 16 - h/2);

		stage.addChild(objects[x][y][0]);
	}	
	else if(id == "hourglass")
	{
		objects[x][y][0]= new createjs.Sprite(hourglassSheet, "idle");

		var w = hourglassSheet.getFrameBounds(0).width
		var h = hourglassSheet.getFrameBounds(0).height
		
		objects[x][y][0].x = Math.floor(x*32 + 16 - w/2);
		objects[x][y][0].y = Math.floor(y*32 + 16 - h/2);;

		stage.addChild(objects[x][y][0]);
	}
	else
	{
		objects[x][y][0] = new createjs.Sprite(levelBaseSheet);

		objects[x][y][0].gotoAndStop(id);

		objects[x][y][0].x = x*32;
		objects[x][y][0].y = y*32;

		stage.addChild(objects[x][y][0]);	
	}
	
	objects[x][y][1] = id;
	objects[x][y][2] = 0;
	
	objects[x][y][3] = objects[x][y][0].x;
	objects[x][y][4] = objects[x][y][0].y;
}

var playersNum = 0;

function createPlayer(id, x, y, socket, name, color)
{
	players[id] = []
	
	players[id][0] = new createjs.Sprite(playerSheet, "idle");
	
	
	var w = playerSheet.getFrameBounds(0).width;
	var h = playerSheet.getFrameBounds(0).height;
	
	players[id][0].regX = Math.floor(w/2);

	players[id][0].x = Math.floor(x*32 + 16);
	players[id][0].y = Math.floor(y*32 + 16 - h/2)-8;
	//players[id][0].addEventListener("animationend", playerAnimationEnd)

	console.log("create player " + name)


	players[id][2] = new createjs.Text(name, "12px sans-serif", color);

	players[id][2].x = players[id][0].x;
	players[id][2].y = players[id][0].y-20;
	players[id][2].textAlign = "center";
		
	var text = Math.floor(players[id][2].getBounds().width/2)

	players[id][1] = new createjs.Shape();
	
	players[id][1].graphics.beginFill("rgba(0,0,0,0.65)").drawRect(0, 0, text*2+8, players[id][2].getBounds().height+2);

	players[id][1].x = players[id][0].x - text - 4;
	players[id][1].y = players[id][2].y + 1;

	players[id][3] = text

	playersBySocket[socket] = id

	stage.addChild(players[id][0]);
	stage.addChild(players[id][1]);
	stage.addChild(players[id][2]);
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
				tiles[x][y].gotoAndStop(1);

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

	for(var i=0; i<playersNum; i++)
	{
		stage.removeChild(players[i][0]);
		stage.removeChild(players[i][1]);
		stage.removeChild(players[i][2]);
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

socket.on("sendRoomStructure", 
	function(data){
		$("#rooms").hide();

		resetTiles();
		
		//struct: roomStructures[room], mySpawn: currentSpawnPoint, players: rooms[room].spawnPoints

		var structure = data.struct;
		
		for(var i in structure.bites)
		{
			generateBiteInMap(structure.bites[i].y, structure.bites[i].dir, structure.bites[i].xsize, structure.bites[i].ysize)
		}
		
		for(var i in structure.objects)
		{
			placeObject(structure.objects[i].id, structure.objects[i].x, structure.objects[i].y)
		}

		for(var i=0; i<4; i++)
		{
			if(data.players[i])
			{

				createPlayer(playersNum, data.players[i].x, data.players[i].y, data.players[i].soc, data.players[i].name, data.players[i].color);
				playersNum ++;
			}
		}
	});

socket.on("pickUpObject", 
	function(data){
		var x = data.x;
		var y = data.y;

		stage.removeChild(objects[x][y][0]);
		
		console.log("delete object: " + objects[x][y][5])

		createdObjects[objects[x][y][5]] = null;
		
		objects[x][y] = null;
	});

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

		var id = playersBySocket[data.soc];

		if(data.direction.x == -1)
			players[id][0].scaleX = -1;
		else if(data.direction.x == 1)
			players[id][0].scaleX = 1;

		players[id][0].x = data.x*32+16;
		players[id][0].y = data.y*32-8;

		players[id][2].x = players[id][0].x;
		players[id][2].y = players[id][0].y-20;
		players[id][1].x = players[id][0].x - players[id][3] - 4;
		players[id][1].y = players[id][2].y + 1;

		jumpPlayer(id, data.direction.x, data.direction.y);
	});

var FPS = 0;

function render(event) {
	FPS = Math.floor(1000/event.delta)
	
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
	
	for(var id=0; id<playersNum; id++)
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
					players[id][0].gotoAndPlay("jump2");
				
				var xv = jumpDatas[id][2]/2;
				var yv = jumpDatas[id][3]/2;
				
				var xP = Math.abs(yv*0.5)*players[id][0].scaleX;
				var yP = -Math.abs(xv*0.5);
				
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
				
				var xP = Math.abs(yv*0.5)*players[id][0].scaleX;
				var yP = -Math.abs(xv*0.5);
				
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
			players[id][1].y = players[id][2].y + 1;
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

		
	}, 150)
	

/*setInterval(
	function()
	{
		jumpPlayer(0, 1, 0)
	}, 500)*/