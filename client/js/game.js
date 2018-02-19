var socket = io('http://localhost:3030');

socket.on('roomList', 
		function(data){
			$("#rooms").html("")
			
			for(var room in data)
			{
				//console.log(data[room])
				$("#rooms").append(room + " " + data[room].currentPlayers + "/" + data[room].neededPlayers + " ");
				$("<a class='joinRoom' id='" + data[room].name + "' href='#'>Belépés</a>").appendTo("#rooms");
			}
		}
	);

$("#rooms").on("click", "a.joinRoom",
	function (){
		console.log("join c")
		socket.emit("joinRoom", $(this).attr("id"))
	});

var stage;
var queue;

var xSize = 21
var ySize = 21

function init()
{
	stage = new createjs.Stage("mainCanvas");

	stage.canvas.width = xSize*32
	stage.canvas.height = ySize*32
	
	queue = new createjs.LoadQueue(true);
	queue.on("complete", handleComplete, this);
	queue.on("fileload", handleFileLoad, this);

	queue.loadFile({id:"levelbase", src:"img/levelbase.png"});
	queue.loadFile({id:"body_sheet", src:"img/body_sheet.png"});
	queue.loadFile({id:"head_sheet", src:"img/head_sheet.png"});

	queue.load();
}

var levelBaseSheet;
var bodySheet;
var headSheet;

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
	else if(event.item.id == "body_sheet")
	{
		bodySheet = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 17, height: 22, regX: 0, regY: 0}, 
			animations: {
				idle: [0, 0],
				jump: [0, 3, "idle", 0.1]
			}
		});
		console.log("body sheet loaded")
	}
	else if(event.item.id == "head_sheet")
	{
		headSheet = new createjs.SpriteSheet({
			images: [event.result], 
			frames: {width: 17, height: 22, regX: 0, regY: 0}, 
			animations: {
				idle: [0, 0],
				jump: [0, 3, "idle", 0.1]
			}
		});
		console.log("body sheet loaded")
	}
}

var players = [];

var tiles = [...Array(xSize).keys()].map(i => Array(ySize));

//2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20

function generateBiteInMap(y, dir, xsize, yize)
{
	if(dir == 1)
	{
		var x = 0

		for(j=x; j<=x+xsize; j++)
			tiles[j][y].gotoAndStop(19);

		tiles[x][y].gotoAndStop(14);

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

		tiles[x+xsize][y].gotoAndStop(5);		
		tiles[x+xsize][y+yize].gotoAndStop(2);		
	}
	else if(dir == 2)
	{
		var x = xSize-1

		for(j=x; j>=x-xsize; j--)
			tiles[j][y].gotoAndStop(19);

		tiles[x][y].gotoAndStop(15);

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

		tiles[x-xsize][y].gotoAndStop(9);		
		tiles[x-xsize][y+yize].gotoAndStop(3);
	}
}

function handleComplete()
{
	console.log("loaded");

	for(x=0; x<xSize; x++)
	{
		for(y=0; y<ySize; y++)
		{
			//console.log(x + ", " + y)
			tiles[x][y] = new createjs.Sprite(levelBaseSheet);

			if(x == xSize-1 && y == ySize-1)
				tiles[x][y].gotoAndStop(20);
			else if(x == 0 && y == 0)
				tiles[x][y].gotoAndStop(8);
			else if(x == xSize-1 && y == 0)
				tiles[x][y].gotoAndStop(12);
			else if(x == 0 && y == ySize-1)
				tiles[x][y].gotoAndStop(21);
			else if(y == ySize-1)
				tiles[x][y].gotoAndStop(19);
			else if(x == 0)
				tiles[x][y].gotoAndStop(6);
			else if(x == xSize-1)
				tiles[x][y].gotoAndStop(11);
			else if(y == 0)
				tiles[x][y].gotoAndStop(4);
			else
				tiles[x][y].gotoAndStop(1);

			tiles[x][y].x = x*32
			tiles[x][y].y = y*32

			stage.addChild(tiles[x][y]);
		}
	}

	//circle = new createjs.Shape();
	//circle.graphics.beginFill("red").drawCircle(16, 16, 16);
	//circle.x = 1*32
	//circle.y = 1*32
	//stage.addChild(circle);
//
	//circle2 = new createjs.Shape();
	//circle2.graphics.beginFill("green").drawCircle(16, 16, 16);
	//circle2.x = (xSize-2)*32
	//circle2.y = 1*32
	//stage.addChild(circle2);
//
	//circle3 = new createjs.Shape();
	//circle3.graphics.beginFill("blue").drawCircle(16, 16, 16);
	//circle3.x = 1*32
	//circle3.y = (ySize-2)*32
	//stage.addChild(circle3);
//
	//circle4 = new createjs.Shape();
	//circle4.graphics.beginFill("purple").drawCircle(16, 16, 16);
	//circle4.x = (xSize-2)*32
	//circle4.y = (ySize-2)*32
	//stage.addChild(circle4);
//
	//circle4 = new createjs.Shape();
	//circle4.graphics.beginFill("gold").drawCircle(16, 16, 16);
	//circle4.x = (xSize-1)/2*32
	//circle4.y = (ySize-1)/2*32
	//stage.addChild(circle4);
	players[0] = []
	
	players[0][0] = new createjs.Sprite(bodySheet, "idle");
	stage.addChild(players[0][0]);
	players[0][0].x = 100
	players[0][0].y = 100

	players[0][1] = new createjs.Sprite(headSheet, "idle");
	stage.addChild(players[0][1]);
	players[0][1].x = 100
	players[0][1].y = 100

	generateBiteInMap(2, 1, 2, 4);
	generateBiteInMap(8, 1, 3, 5);
	generateBiteInMap(15, 1, 2, 2);

	generateBiteInMap(3, 2, 1, 3);
	generateBiteInMap(8, 2, 2, 1);
	generateBiteInMap(12, 2, 1, 4);

	createjs.Ticker.framerate = 60;
	createjs.Ticker.on("tick", render);
}

var FPS = 0;

function render(event) {
	FPS = Math.floor(1000/event.delta)
	
	stage.update();
}

setInterval(
	function()
	{
		$(".fpsCounter").html(FPS + " FPS")
		players[0][0].gotoAndPlay("jump");
		players[0][1].gotoAndPlay("jump");
	}, 1000)