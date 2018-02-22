/*var app = require("express")();
var http = require("http").Server(app);

app.get("/", function(req, res){
	res.send("<h1>dungeon.it server</h1>");
});

var port = 8080

http.listen(port, function(){
	console.log("listening on :" + port);
});*/

//var io = require("socket.io")(http);

var io = require('socket.io').listen(8080);


var clients = 0

var rooms = {}
var roomStructures = {}

rooms["Teszt szoba"] = {
	neededPlayers: 3,
	currentPlayers: 0,
	started: false,
	spawnPoints: [],
}

roomStructures["Teszt szoba"] = {
	bites: [],
	objects: [],
	roomCollisions: [],
}

function randomBetween(min, max)
{
	return Math.floor((Math.random() * (max-min+1)) + min);
}

function generateMap(room)
{
	var roomCollisions = [...Array(21).keys()].map(i => Array(21))
	
	roomCollisions[1][1] = true;
	roomCollisions[1][19] = true;
	roomCollisions[19][19] = true;
	roomCollisions[19][1] = true;

	console.log("generating map of room: " + room)
	//generateBiteInMap(y, dir, xsize, yize)
	
	var num = randomBetween(1,3);
	
	//console.log("num: " + num);

	var curr = 0;

	for(var i=0; i<num; i++)
	{
		var oneSize = Math.floor(18/num)
		var sY = randomBetween(Math.max(2+oneSize*i, curr+1), 1+oneSize*(i+1));
		var ySize = randomBetween(2, oneSize-1);
		
		//console.log("bite " + i +  ": " + oneSize + ", " + (1+oneSize*i) + ", " + (oneSize*(i+1)))
		//console.log("sy: " + sY + ", " + ySize)

		var x = 0;
		var xsize = randomBetween(1, 5);

		if((sY + ySize) >= 18)
		{
			break;
		}

		for(j=x; j<=x+xsize; j++)
		{
			for(k=sY; k<=sY+ySize; k++)
			{
				roomCollisions[j][k] = "nomove";
			}
		}
		
		curr = sY+ySize

		var bite = {
			y: sY,
			dir: 1,
			xsize: xsize,
			ysize: ySize,
		}
		
		roomStructures[room].bites.push(bite)
		
		console.log("generate bite: dir1, " + sY + ", " + ySize)
	}
	
	var num = randomBetween(1,3);

	var curr = 0;

	for(var i=0; i<num; i++)
	{
		var oneSize = Math.floor(18/num)
		var sY = randomBetween(Math.max(2+oneSize*i, curr+1), 1+oneSize*(i+1));
		var ySize = randomBetween(2, oneSize-1);
		
		//console.log("bite " + i +  ": " + oneSize + ", " + (1+oneSize*i) + ", " + (oneSize*(i+1)))
		//console.log("sy: " + sY + ", " + ySize)

		var x = 21-1;
		var xsize = randomBetween(1, 5);

		if((sY + ySize) >= 18)
		{
			break;
		}

		for(j=x; j>=x-xsize; j--)
		{
			for(k=sY; k<=sY+ySize; k++)
			{
				roomCollisions[j][k] = "nomove";
			}
		}

		curr = sY+ySize

		var bite = {
			y: sY,
			dir: 2,
			xsize: xsize,
			ysize: ySize,
		}	
		
		roomStructures[room].bites.push(bite)
		
		console.log("generate bite: dir2, " + sY + ", " + ySize)
	}
	
	var obj = {
		id: 24,
		x: 10,
		y: 10,
	} //chest
	
	roomStructures[room].objects.push(obj);
	roomCollisions[10][10] = true;
	

	/* HORDÓK */
	
	var objs = randomBetween(10, 15)//+5000;
	
	for(var i=0; i<objs; i++)
	{
		var x = randomBetween(1, 19);
		var y = randomBetween(1, 19);
		
		if(!roomCollisions[x][y])
		{
			var obj = {
				id: 26,
				x: x,
				y: y,
			}
			
			roomStructures[room].objects.push(obj);
			roomCollisions[x][y] = "nomove";
		}
	}

	/* POWERUPOK */

	var objs = randomBetween(5, 10);
	
	for(var i=0; i<objs; i++)
	{
		var x = randomBetween(1, 19);
		var y = randomBetween(1, 19);
		
		if(!roomCollisions[x][y])
		{
			var rand = ""

			switch(randomBetween(1, 3))
			{
				case 1:
				rand = "snowflake";
				break;

				case 2:
				rand = "cannonball";
				break;

				case 3:
				rand = "hourglass";
				break;
			}

			var obj = {
				id: rand,
				x: x,
				y: y,
			}
			
			roomStructures[room].objects.push(obj);
			roomCollisions[x][y] = "pickable";
		}
	}

	roomStructures[room].roomCollisions = roomCollisions;
}

generateMap("Teszt szoba")

io.emit("roomList", rooms)

function getRoomUsersLength(room) {
	if(io.nsps["/"].adapter.rooms[room])
		return io.nsps["/"].adapter.rooms[room].length
	else
		return 0
}

function getRoomUsers(room) {
	if(io.nsps["/"].adapter.rooms[room])
		return io.nsps["/"].adapter.rooms[room].sockets
	else
		return 0
}

function isRoomExists(room) {
	return (io.nsps["/"].adapter.rooms[room] || rooms[room])
}

function refreshRoomPlayers(room)
{
	rooms[room].currentPlayers = getRoomUsersLength(room)
	io.emit("roomList", rooms)
}

function getRandomSpawnPoint(room) {
	var id = randomBetween(0, 3);
	
	while(rooms[room].spawnPoints[id])
		id  = randomBetween(0, 3);

	return id;
}



function getTickCount()
{
	return (new Date).getTime();
}

var playerDatas = []

io.on("connection", function(socket){
	clients ++;

	socket.emit("roomList", rooms)

	console.log("user " + socket.id + " connected, clients: " + clients);

	var currentRoom = false;
	var currentSpawnPoint = -1;


	socket.on("moveCharacter", 
		function(direction)
		{
			//console.log("mvchr1 " + playerDatas[socket.id].nextMove + ", " + getTickCount());
			//console.log(playerDatas[socket.id].nextMove < getTickCount());
			if(currentRoom && currentSpawnPoint >= 0 && playerDatas[socket.id] && playerDatas[socket.id].nextMove < getTickCount())
			{
				//console.log("mvchr2 " + playerDatas[socket.id].nextMove + ", " + getTickCount());

				var x = playerDatas[socket.id].x+direction.x
				var y = playerDatas[socket.id].y+direction.y

				if(x >= 1 && y >= 1 && x <= 19 && y <= 19 &&
					(!roomStructures[currentRoom].roomCollisions[x] || roomStructures[currentRoom].roomCollisions[x][y] != "nomove"))
				{
					//console.log("user " + socket.id + " move char: " + direction.x + ", " + direction.y);

 					var movementDatas = {
 						soc: socket.id,
 						x: playerDatas[socket.id].x,
 						y: playerDatas[socket.id].y,
 						direction: direction
 					}

 					playerDatas[socket.id].x = x
 					playerDatas[socket.id].y = y
 					playerDatas[socket.id].nextMove = getTickCount()+240

 					if(roomStructures[currentRoom].roomCollisions[x] && roomStructures[currentRoom].roomCollisions[x][y] == "pickable")
 					{
 						roomStructures[currentRoom].roomCollisions[x][y] = null
 						console.log("user " + socket.id + " pickup up pickable at " + x + ", " + y + ".")
 						io.to(currentRoom).emit("pickUpObject", {x: x, y: y})
 					}

 					io.to(currentRoom).emit("moveCharacter", movementDatas)
				}
			}
		});

	socket.on("joinRoom", 
		function(room){
			//console.log("user " + socket.id + " trying to join: " + room)
			if(!currentRoom && rooms[room] && getRoomUsersLength(room) < rooms[room].neededPlayers && !rooms[room].started)
			{
				currentRoom = room;
				
				socket.join(room);
				refreshRoomPlayers(room);

				currentSpawnPoint = getRandomSpawnPoint(room);

				var color = "mediumseagreen"

				var x = 1;
				var y = 1;

				switch(currentSpawnPoint)
				{
					case 1:
						x = 1;
						y = 19;
						color = "darkcyan";
					break;

					case 2:
						x = 19;
						y = 19;
						color = "indianred";
					break;

					case 3:
						x = 19;
						y = 1;
						color = "gold";
					break;
				}

				playerDatas[socket.id] = {
					x: x,
					y: y,
					color: color,
					name: "name",
					soc: socket.id,
					nextMove: 0,
				}

				var players = []

				var users = getRoomUsers(room);

				for(var id in users)
				{
					players.push(playerDatas[id]);
				}

				rooms[room].spawnPoints[currentSpawnPoint] = socket.id

				//socket.emit
				io.to(currentRoom).emit("sendRoomStructure", {struct: roomStructures[room], mySpawn: currentSpawnPoint, players: players});
				
				console.log("user " + socket.id + " joined room: " + room + ", (Sp: " + currentSpawnPoint + ") users in room: " + rooms[room].currentPlayers)
			}
		});

	socket.on("disconnect", 
		function(){
			playerDatas[socket.id] = false;
			clients --;

			console.log("user " + socket.id + " disconnected, clients: " + clients + ", room:" + currentRoom);

			if(currentRoom)
			{
				console.log("user " + socket.id + " was in room " + currentRoom)
				rooms[currentRoom].spawnPoints[currentSpawnPoint] = false
				refreshRoomPlayers(currentRoom)
			}
		});


	socket.on('latency', function (startTime, cb) {
		cb(startTime);
	}); 
});