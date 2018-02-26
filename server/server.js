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

var stdin = process.openStdin();

stdin.addListener("data", function(d) {
		var cmd = d.toString().trim();

		console.log("command: [" + cmd + "]");
	});

var clients = 0

var rooms = {}
var roomStructures = {}



function randomBetween(min, max)
{
	return Math.floor((Math.random() * (max-min+1)) + min);
}

function createObject(room, oid, x, y)
{
	var obj = {
		id: oid,
		x: x,
		y: y,
	} //chest
	
	return roomStructures[room].objects.push(obj) - 1;
}

function generateMap(room)
{
	var roomCollisions = [...Array(21).keys()].map(i => Array(21))
	var pickables = [...Array(21).keys()].map(i => Array(21))
	
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
	
	/* LÁDA */

	var id = createObject(room, 24, 10, 10);
	roomCollisions[10][10] = "pickable";
	pickables[10][10] = id
	

	/* HORDÓK */
	
	var objs = randomBetween(10, 15)//+5000;
	
	for(var i=0; i<objs; i++)
	{
		var x = randomBetween(1, 19);
		var y = randomBetween(1, 19);
		
		if(!roomCollisions[x][y])
		{
			/*var obj = {
				id: 26,
				x: x,
				y: y,
			}
			
			roomStructures[room].objects.push(obj);*/
			createObject(room, 26, x, y);
			roomCollisions[x][y] = "nomove";
		}
	}

	/* POWERUPOK */

	var objs = randomBetween(10, 15);
	
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

			/*var obj = {
				id: rand,
				x: x,
				y: y,
			}
			
			var id = roomStructures[room].objects.push(obj) - 1;*/

			var id = createObject(room, rand, x, y);

			roomCollisions[x][y] = "pickable";
			pickables[x][y] = id;
		}
	}

	roomStructures[room].roomCollisions = roomCollisions;
	roomStructures[room].pickables = pickables;
}


function createRoom(roomName, players)
{
	rooms[roomName] = {
		neededPlayers: players,
		currentPlayers: 0,
		started: false,
		spawnPoints: [],
	}

	roomStructures[roomName] = {
		bites: [],
		objects: [],
		roomCollisions: [],
		pickables: [],
	}

	generateMap(roomName)

	//io.emit("roomList", rooms)
}

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

	if(rooms[room].currentPlayers <= 0)
	{
		delete rooms[room];
		delete roomStructures[room];
		console.log("deleted room: " + room)
	}

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
var projectiles = []

function killPlayer(id, by)
{

	var room = playerDatas[id].room;

	if(playerDatas[id].carrying)
	{
		var oid = createObject(room, playerDatas[id].carrying, playerDatas[id].x, playerDatas[id].y);
		roomStructures[room].roomCollisions[playerDatas[id].x][playerDatas[id].y] = "pickable";
		roomStructures[room].pickables[playerDatas[id].x][playerDatas[id].y] = oid

		io.to(room).emit("objectCreated", {id: playerDatas[id].carrying, x: playerDatas[id].x, y: playerDatas[id].y, carrying: id})

		playerDatas[id].carrying = null
	}

	var x = playerDatas[id].sx;
	var y = playerDatas[id].sy;

	playerDatas[id].x = x;
	playerDatas[id].y = y;

	io.to(room).emit("teleportCharacter", {soc: id, x: x, y: y});

	if(by && playerDatas[by])
		io.to(room).emit("chatMessage", "<font color='" + playerDatas[id].color + "'>" + playerDatas[id].name + "</font> killed by <font color='" + playerDatas[by].color + "'>" + playerDatas[by].name + "</font>")
	else
		io.to(room).emit("chatMessage", "<font color='" + playerDatas[id].color + "'>" + playerDatas[id].name + "</font> killed")
}

function checkProjectileDeath(currentRoom, timer, id, obj)
{
	projectiles[id].x += projectiles[id].xdir
	projectiles[id].y += projectiles[id].ydir

	var deleteProjectile = false;

	if(projectiles[id].x > 21 || projectiles[id].x < 0 || projectiles[id].y > 21 || projectiles[id].y < 0)
		deleteProjectile = true;
	else if (roomStructures[currentRoom].roomCollisions[projectiles[id].x] && roomStructures[currentRoom].roomCollisions[projectiles[id].x][projectiles[id].y] && roomStructures[currentRoom].roomCollisions[projectiles[id].x][projectiles[id].y] != "pickable")
		deleteProjectile = true;
	else
	{
		if(projectiles[id].obj == "cannonball")
		{
			var users = getRoomUsers(currentRoom);

			for(var uid in users)
			{
				if(playerDatas[uid].x == projectiles[id].x && playerDatas[uid].y == projectiles[id].y)
				{
					deleteProjectile = true;

					killPlayer(uid, projectiles[id].carrying);
				}
			}
		}
	}

	if(deleteProjectile)
	{
		io.to(currentRoom).emit("deleteProjectile", id);
		clearInterval(timer);
	}
}

function joinRoom(socket, data, currentRoom)
{
	var room = data.room

	if(!currentRoom && rooms[room] && getRoomUsersLength(room) < rooms[room].neededPlayers && !rooms[room].started)
	{
		currentRoom = room;
	

		var currentSpawnPoint = getRandomSpawnPoint(room);

		var color = "mediumseagreen"
		var colorname = "green";

		var x = 1;
		var y = 1;

		switch(currentSpawnPoint)
		{
			case 1:
				x = 1;
				y = 19;
				color = "darkcyan";
				colorname = "blue";
			break;

			case 2:
				x = 19;
				y = 19;
				color = "indianred";
				colorname = "red";
			break;

			case 3:
				x = 19;
				y = 1;
				color = "gold";
				colorname = "yellow";
			break;
		}

		playerDatas[socket.id] = {
			x: x,
			y: y,
			sx: x,
			sy: y,
			color: color,
			name: data.name,//"Name",
			soc: socket.id,
			room: currentRoom,
			nextMove: 0,
		}

		var players = []

		var users = getRoomUsers(room);

		for(var id in users)
		{
			players.push(playerDatas[id]);
		}

		players.push(playerDatas[socket.id]);

		rooms[room].spawnPoints[currentSpawnPoint] = socket.id

		io.to(currentRoom).emit("chatMessage", "<font color='" + color + "'>" + data.name + "</font> joined")

		socket.emit("chatMessage", "Joined room '<font color='indianred'>" + room + "</font>'")
		socket.emit("chatMessage", "You are color '<font color='" + color + "'>" + colorname + "</font>'")

		io.to(currentRoom).emit("createPlayer", playerDatas[socket.id])
		socket.emit("sendRoomStructure", {struct: roomStructures[room], name: room, mySpawn: currentSpawnPoint, players: players, collisions: roomStructures[currentRoom].roomCollisions});

		socket.join(room);
		refreshRoomPlayers(room);
		
		console.log("user " + socket.id + " joined room: " + room + ", (Sp: " + currentSpawnPoint + ") users in room: " + rooms[room].currentPlayers)

		return {room: currentRoom, spawnPoint: currentSpawnPoint}
	}
	else
	{
		if(rooms[room].started)
			socket.emit("chatMessage", "<font color='indianred'>Failed to join room '" + room + "'. (Game already started!)</font>")
		else if(getRoomUsersLength(room) >= rooms[room].neededPlayers)
			socket.emit("chatMessage", "<font color='indianred'>Failed to join room '" + room + "'. (Player limit reached!)</font>")
		else
			socket.emit("chatMessage", "<font color='indianred'>Failed to join room '" + room + "'.</font>")

		return false
	}
}

io.on("connection", function(socket){
	clients ++;

	socket.emit("roomList", rooms)

	console.log("user " + socket.id + " connected, clients: " + clients);

	var currentRoom = false;
	var currentSpawnPoint = -1;


	socket.on("writeChat", 
		function(data)
		{
			//TODO: HTMLSPECIALCHARS
			if(currentRoom)
				io.to(currentRoom).emit("chatMessage", "<font color='" + playerDatas[socket.id].color + "'>" + playerDatas[socket.id].name + "</font>: " + data)
		});

	socket.on("putDownCarrying", 
		function()
		{
			if(currentRoom && rooms[currentRoom].started)
			{
				if(playerDatas[socket.id].carrying && (!roomStructures[currentRoom].roomCollisions[playerDatas[socket.id].x] || !roomStructures[currentRoom].roomCollisions[playerDatas[socket.id].x][playerDatas[socket.id].y]))
				{	
					if(playerDatas[socket.id].carrying == "cannonball" || playerDatas[socket.id].carrying == "snowflake")
					{
						projectile = {
							x: playerDatas[socket.id].x,
							y: playerDatas[socket.id].y,
							obj: playerDatas[socket.id].carrying,
							carrying: socket.id,
							xdir: 1,
							ydir: 0,
						}

						var id = projectiles.push(projectile) - 1;

						io.to(currentRoom).emit("createProjectile", {id: id, x: playerDatas[socket.id].x, y: playerDatas[socket.id].y, obj: playerDatas[socket.id].carrying, carrying: socket.id, xdir: 1, ydir: 0})

						var timer = setInterval(function () { checkProjectileDeath(currentRoom, timer, id) }, 100)
					}
					else
					{
						var id = createObject(currentRoom, playerDatas[socket.id].carrying, playerDatas[socket.id].x, playerDatas[socket.id].y);
						roomStructures[currentRoom].roomCollisions[playerDatas[socket.id].x][playerDatas[socket.id].y] = "pickable";
						roomStructures[currentRoom].pickables[playerDatas[socket.id].x][playerDatas[socket.id].y] = id
						
						io.to(currentRoom).emit("objectCreated", {id: playerDatas[socket.id].carrying, x: playerDatas[socket.id].x, y: playerDatas[socket.id].y, carrying: socket.id})
					}

					playerDatas[socket.id].carrying = false
				}
			}
		});

	socket.on("moveCharacter", 
		function(direction)
		{
			//console.log("mvchr1 " + playerDatas[socket.id].nextMove + ", " + getTickCount());
			//console.log(playerDatas[socket.id].nextMove < getTickCount());
			//console.log(currentRoom)
			if(currentRoom && rooms[currentRoom].started && currentSpawnPoint >= 0 && playerDatas[socket.id] && playerDatas[socket.id].nextMove < getTickCount())
			{
				//console.log("mvchr2 " + playerDatas[socket.id].nextMove + ", " + getTickCount());
				if(  (Math.abs(direction.x) == 0 || Math.abs(direction.x) == 1)
				  && (Math.abs(direction.y) == 0 || Math.abs(direction.y) == 1))

				{
					var x = playerDatas[socket.id].x
					var y = playerDatas[socket.id].y

					if(direction.px != x || direction.py != y)
					{
						if(Math.abs(direction.px-x) > 2 || Math.abs(direction.py-y) > 2)
						{
							io.to(currentRoom).emit("teleportCharacter", {soc: socket.id, x: x, y: y})
						}
						else
						{
							x = direction.px;
							y = direction.py;
						}
					}

					x += direction.x
					y += direction.y

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

	 					//console.log(x + ", " + y)

	 					playerDatas[socket.id].x = x
	 					playerDatas[socket.id].y = y
	 					playerDatas[socket.id].nextMove = getTickCount()+200//240

	 					if(roomStructures[currentRoom].roomCollisions[x] && roomStructures[currentRoom].roomCollisions[x][y] == "pickable" && !playerDatas[socket.id].carrying)
	 					{
	 						roomStructures[currentRoom].roomCollisions[x][y] = null

	 						if(roomStructures[currentRoom].objects[roomStructures[currentRoom].pickables[x][y]].id != "hourglass")
	 						{
	 							playerDatas[socket.id].carrying = roomStructures[currentRoom].objects[roomStructures[currentRoom].pickables[x][y]].id;

	 							io.to(currentRoom).emit("pickUpObject", {x: x, y: y, soc: socket.id, obj: playerDatas[socket.id].carrying})
	 						}
	 						else
	 						{
	 							io.to(currentRoom).emit("pickUpObject", {x: x, y: y, obj: playerDatas[socket.id].carrying})
	 						}

	 						delete roomStructures[currentRoom].objects[roomStructures[currentRoom].pickables[x][y]];
 							roomStructures[currentRoom].pickables[x][y] = null;

 							console.log("user " + socket.id + " pickup up pickable at " + x + ", " + y + " | " + playerDatas[socket.id].carrying + ".")
	 					}

	 					io.to(currentRoom).emit("moveCharacter", movementDatas)
					}
				}
			}
		});

	socket.on("createRoom", 
		function(data){
			if(!currentRoom)
			{
				if(!rooms[data.name])
				{
					if(data.num >= 2 && data.num <= 4)
					{
						createRoom(data.name, data.num)
						socket.emit("chatMessage", "<font color='mediumseagreen'>Room '" + data.name + "' successfully created!</font>")
						
						var dat = joinRoom(socket, {room: data.name, name: data.player}, currentRoom);

						if(dat)
						{
							currentRoom = dat.room;
							currentSpawnPoint = dat.spawnPoint;
						}

						console.log("user " + socket.id + " joined room '" + currentRoom + "'")
					}
				}
				else
				{
					socket.emit("chatMessage", "<font color='indianred'>Room with name '" + data.name + "' already exists!</font>")
				}
			}
		});

	socket.on("joinRoom", 
		function(data){
			//console.log("user " + socket.id + " trying to join: " + room)
			var dat = joinRoom(socket, data, currentRoom);

			if(dat)
			{
				currentRoom = dat.room;
				currentSpawnPoint = dat.spawnPoint;
			}


			console.log("user " + socket.id + " joined room '" + currentRoom + "'")
		});

	socket.on("disconnect", 
		function(){
			console.log("user " + socket.id + " disconnected, clients: " + clients + ", room:" + currentRoom);

			if(currentRoom)
			{
				console.log("user " + socket.id + " was in room " + currentRoom)
				rooms[currentRoom].spawnPoints[currentSpawnPoint] = false
				refreshRoomPlayers(currentRoom)

				if(playerDatas[socket.id].carrying)
				{
					var id = createObject(currentRoom, playerDatas[socket.id].carrying, playerDatas[socket.id].x, playerDatas[socket.id].y);
					roomStructures[currentRoom].roomCollisions[playerDatas[socket.id].x][playerDatas[socket.id].y] = "pickable";
					roomStructures[currentRoom].pickables[playerDatas[socket.id].x][playerDatas[socket.id].y] = id

					io.to(currentRoom).emit("objectCreated", {id: playerDatas[socket.id].carrying, x: playerDatas[socket.id].x, y: playerDatas[socket.id].y})
				}

				io.to(currentRoom).emit("chatMessage", "<font color='" + playerDatas[socket.id].color + "'>" + playerDatas[socket.id].name + "</font> disconnected")
				io.to(currentRoom).emit("destroyPlayer", socket.id)
			}

			playerDatas[socket.id] = false;
			clients --;
		});


	socket.on('latency', function (startTime, cb) {
		cb(startTime);
	}); 
});