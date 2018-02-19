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

function init()
{
	stage = new createjs.Stage("mainCanvas");
	
	queue = new createjs.LoadQueue(true);
	queue.on("complete", handleComplete, this);
	queue.on("fileload", handleFileLoad, this);

	queue.loadFile({id:"player", src:"img/player.png"});
	queue.loadFile({id:"stone", src:"img/stone.png"});
	queue.loadFile({id:"nemet", src:"img/nemet.png"});
	queue.loadFile({id:"tori", src:"img/tori.png"});

	queue.load();
}

var images = [];

function handleFileLoad(event)
{
	var image = event.result;
	
	images[event.item.id] = image;

	console.log("file loaded");
	console.log(event.item.id);
}

var playerElement;

//24px x 27 db
var tiles = [...Array(27).keys()].map(i => Array(27));

function handleComplete()
{
	console.log("loaded");

	for(x=0; x<27; x++)
	{
		for(y=0; y<27; y++)
		{
			//console.log(x + ", " + y)
			tiles[x][y] = new createjs.Bitmap(images["stone"]);

			tiles[x][y].x = x*24
			tiles[x][y].y = y*24

			stage.addChild(tiles[x][y]);
		}
	}

	playerElement = new createjs.Bitmap(images["tori"]);
	stage.addChild(playerElement);

	playerElement.x =  648/2-24;
	playerElement.y = 60;

	playerElement = new createjs.Bitmap(images["nemet"]);
	stage.addChild(playerElement);

	playerElement.x = 648/2-24;
	playerElement.y = 648/2-24;

	playerElement = new createjs.Bitmap(images["player"]);
	stage.addChild(playerElement);

	playerElement.x = 123;
	playerElement.y = 211;

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
	}, 1000)