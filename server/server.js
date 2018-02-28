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

function escapeHtml(text) {
	var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};

	return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

var io = require('socket.io').listen(8080);

var stdin = process.openStdin();

var clients = 0

var rooms = {}
var roomStructures = {}

stdin.addListener("data", function(d) {
		var cmdin = d.toString().trim();

		console.log("command: [" + cmdin + "]");

		cmd = cmdin.split(" ");

		if(cmd[0] == "clients")
		{
			console.log("online clients: " + clients)
		}
		else if(cmd[0] == "genpickup")
		{
			if(cmd[1])
			{
				var room = cmdin.slice(10);

				if(rooms[room])
				{
					for(var i=0; i<10; i++)
					{
						var x = randomBetween(1, 19);
						var y = randomBetween(1, 19);
						
						if(!roomStructures[room].roomCollisions[x][y])
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

							var id = createObject(room, rand, x, y);

							roomStructures[room].roomCollisions[x][y] = "pickable";
							roomStructures[room].pickables[x][y] = id;

							io.to(room).emit("objectCreated", {id: rand, x: x, y: y})
						}
					}

					console.log("generated pickups in room '" + room + "'")
				}
				else
				{
					console.log("room '" + room + "' not found")
				}
			}
			else
			{
				console.log("use: '" + cmd[0] + " <room name>'")
			}
		}
		else
		{
			console.log("unknown command '" + cmd[0] + "'")
		}
	});

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
	
	/* CHEST */

	var id = createObject(room, 24, 10, 10);
	roomCollisions[10][10] = "pickable";
	pickables[10][10] = id
	

	/* BARRIERS */
	
	var objs = randomBetween(10, 13)//+5000;
	
	for(var i=0; i<objs; i++)
	{
		var x = randomBetween(1+1, 19-1);
		var y = randomBetween(1+1, 19-1);
		
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

	/* PICKUPS */

	var objs = randomBetween(15, 20);
	
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

	roomCollisions[1][1] = null;
	roomCollisions[1][19] = null;
	roomCollisions[19][19] = null;
	roomCollisions[19][1] = null;

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
		timeouts: [],
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
		for(var i in roomStructures[room].timeouts)
		{
			if(roomStructures[room].timeouts[i])
				clearTimeout(roomStructures[room].timeouts[i])
		}

		roomStructures[room].timeouts = []

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

function freezePlayer(currentRoom, uid, state)
{
	playerDatas[uid].frozen = state

	if(state === false)
		io.to(currentRoom).emit("freezePlayer", {id: uid, state: false})
	else
		io.to(currentRoom).emit("freezePlayer", {id: uid, state: true})
}

function checkProjectileDeath(currentRoom, timer, id, obj)
{
	if(!rooms[currentRoom])
	{
		delete projectiles[id];
		clearInterval(timer);
	}
	else
	{
		projectiles[id].x += projectiles[id].xdir
		projectiles[id].y += projectiles[id].ydir

		var deleteProjectile = false;

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
		else if(projectiles[id].obj == "snowflake")
		{
			var users = getRoomUsers(currentRoom);

			for(var uid in users)
			{
				if(playerDatas[uid].x == projectiles[id].x && playerDatas[uid].y == projectiles[id].y)
				{
					deleteProjectile = true;

					var timerid = roomStructures[currentRoom].timeouts.length;

					if(playerDatas[uid].frozen)
					{
						timerid = playerDatas[uid].frozen
						clearTimeout(timerid);
					}

					roomStructures[currentRoom].timeouts[timerid] = setTimeout(freezePlayer, 5000, currentRoom, uid, false);

					freezePlayer(currentRoom, uid, timerid)
				}
			}
		}

		var oor = false

		if(projectiles[id].x > 21 || projectiles[id].x < 0 || projectiles[id].y > 21 || projectiles[id].y < 0)
		{
			deleteProjectile = true;
			oor = true;
		}
		else if (roomStructures[currentRoom].roomCollisions[projectiles[id].x] && roomStructures[currentRoom].roomCollisions[projectiles[id].x][projectiles[id].y] && roomStructures[currentRoom].roomCollisions[projectiles[id].x][projectiles[id].y] != "pickable")
			deleteProjectile = true;

		if(deleteProjectile)
		{
			io.to(currentRoom).emit("deleteProjectile", {id: id, outOfRange: oor});
			
			clearInterval(timer);

			if(projectiles[id].obj == "cannonball" || projectiles[id].obj == "snowflake")
			{
				if(randomBetween(1, 10) < 8)
				{
					var x = randomBetween(1+1, 19-1);
					var y = randomBetween(1+1, 19-1);

					if(!roomStructures[currentRoom].roomCollisions[x][y])
					{
						var oid = createObject(currentRoom, projectiles[id].obj, x, y);

						roomStructures[currentRoom].roomCollisions[x][y] = "pickable";
						roomStructures[currentRoom].pickables[x][y] = oid;

						io.to(currentRoom).emit("objectCreated", {id: projectiles[id].obj, x: x, y: y});
					}
				}
			}

			delete projectiles[id];
		}
	}
}

function joinRoom(socket, data, currentRoom)
{
	var room = escapeHtml(data.room)

	if(!currentRoom && rooms[room] && getRoomUsersLength(room) < rooms[room].neededPlayers && !rooms[room].started && !rooms[room].gameover && !rooms[room].cd)
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
			name: escapeHtml(data.name),//"Name",
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

		var needed = rooms[room].neededPlayers-rooms[room].currentPlayers

		if(needed == 0)
		{
			io.to(currentRoom).emit("chatMessage",  "<font color='mediumseagreen'>Starting countdown...</font>")

			rooms[currentRoom].cd = true
			io.to(currentRoom).emit("bigText", {text: false})

			for(var i in roomStructures[currentRoom].timeouts)
			{
				if(roomStructures[currentRoom].timeouts[i])
					clearTimeout(roomStructures[currentRoom].timeouts[i])
			}

			roomStructures[currentRoom].timeouts = []
			
			roomStructures[currentRoom].timeouts[0] = setTimeout(function () { io.to(currentRoom).emit("bigText", {sound: true, text: "READY!", time: 900, size: 1}) }, 2000)
			roomStructures[currentRoom].timeouts[1] = setTimeout(function () { io.to(currentRoom).emit("bigText", {text: "SET!", time: 900, size: 1}) }, 3000)
			roomStructures[currentRoom].timeouts[2] = setTimeout(function () { 
				if(rooms[currentRoom])
				{
					io.to(currentRoom).emit("bigText", {text: "<font color='mediumseagreen'>GO!</font>", time: 1500, size: 2})
					io.to(currentRoom).emit("chatMessage",  "Game <font color='mediumseagreen'>started</font>!")
					io.to(currentRoom).emit("gameStarted", true)

					rooms[currentRoom].started = true
					rooms[currentRoom].cd = false

					roomStructures[currentRoom].timeouts = []

					io.emit("roomList", rooms)
				}
			}, 4000)
		}
		else if(needed == 1)
			io.to(currentRoom).emit("chatMessage",  "<font color='mediumseagreen'>" + needed + "</font> more player needed to start game")
		else
			io.to(currentRoom).emit("chatMessage",  "<font color='mediumseagreen'>" + needed + "</font> more players needed to start game")
		
		console.log("user " + socket.id + " joined room: " + room + ", (Sp: " + currentSpawnPoint + ") users in room: " + rooms[room].currentPlayers)

		return {room: currentRoom, spawnPoint: currentSpawnPoint}
	}
	else
	{
		/*if(rooms[room].started)
			socket.emit("chatMessage", "<font color='indianred'>Failed to join room '" + room + "'. (Game already started!)</font>")
		else if(getRoomUsersLength(room) >= rooms[room].neededPlayers)
			socket.emit("chatMessage", "<font color='indianred'>Failed to join room '" + room + "'. (Player limit reached!)</font>")
		else
			socket.emit("chatMessage", "<font color='indianred'>Failed to join room '" + room + "'.</font>")
		*/

		return false
	}
}

io.on("connection", function(socket){
	clients ++;

	socket.emit("roomList", rooms)

	console.log("user " + socket.id + " connected, clients: " + clients);

	var currentRoom = false;
	var currentSpawnPoint = -1;

	socket.on("writingChat", 
		function(data)
		{
			if(currentRoom)
				io.to(currentRoom).emit("writingChat", {state: data, soc: socket.id});
		});

	socket.on("writeChat", 
		function(data)
		{
			if(currentRoom)
				io.to(currentRoom).emit("chatMessage", "<font color='" + playerDatas[socket.id].color + "'>" + playerDatas[socket.id].name + "</font>: " + escapeHtml(data))
		});

	socket.on("putDownCarrying", 
		function(data)
		{
			if(currentRoom && rooms[currentRoom].started)
			{
				if(playerDatas[socket.id].carrying && (!roomStructures[currentRoom].roomCollisions[playerDatas[socket.id].x] || !roomStructures[currentRoom].roomCollisions[playerDatas[socket.id].x][playerDatas[socket.id].y]))
				{	
					if(data.px != playerDatas[socket.id].x || data.py != playerDatas[socket.id].y)
					{
						if(Math.abs(data.px-playerDatas[socket.id].x) > 2 || Math.abs(data.py-playerDatas[socket.id].y) > 2)
						{
							io.to(currentRoom).emit("teleportCharacter", {soc: socket.id, x: playerDatas[socket.id].x, y: playerDatas[socket.id].y})
						}
						else
						{
							playerDatas[socket.id].x = data.px;
							playerDatas[socket.id].y = data.py;
						}
					}

					if(playerDatas[socket.id].carrying == "cannonball" || playerDatas[socket.id].carrying == "snowflake")
					{
						//TODO: ARGUMENT CHECK
						if((Math.abs(data.x)+Math.abs(data.y)) == 1)
						{
							var xt = playerDatas[socket.id].x+data.x;
							var yt = playerDatas[socket.id].y+data.y;

							if(xt <= 19 && xt >= 1 && yt <= 19 && yt >= 1 && 
								!(roomStructures[currentRoom].roomCollisions[xt] && roomStructures[currentRoom].roomCollisions[xt][yt] && roomStructures[currentRoom].roomCollisions[xt][yt] != "pickable")
							)
							{
								var projectile = {
									x: playerDatas[socket.id].x,
									y: playerDatas[socket.id].y,
									obj: playerDatas[socket.id].carrying,
									carrying: socket.id,
									xdir: data.x,
									ydir: data.y,
								}

								var id = 0;

								for(var i=0; i<=projectiles.length; i++)
								{
									if(!projectiles[i])
									{
										id = i;
										break;
									}
								}

								projectiles[id] = projectile

								console.log(currentRoom + " created projectile with id: " + id)

								io.to(currentRoom).emit("createProjectile", {id: id, x: playerDatas[socket.id].x, y: playerDatas[socket.id].y, obj: playerDatas[socket.id].carrying, carrying: socket.id, xdir: data.x, ydir: data.y})

								var timer = setInterval(function () { checkProjectileDeath(currentRoom, timer, id) }, 75) // projectile speed as time

								playerDatas[socket.id].carrying = false
							}
						}
					}
					else
					{
						var id = createObject(currentRoom, playerDatas[socket.id].carrying, playerDatas[socket.id].x, playerDatas[socket.id].y);
						roomStructures[currentRoom].roomCollisions[playerDatas[socket.id].x][playerDatas[socket.id].y] = "pickable";
						roomStructures[currentRoom].pickables[playerDatas[socket.id].x][playerDatas[socket.id].y] = id
						
						io.to(currentRoom).emit("objectCreated", {id: playerDatas[socket.id].carrying, x: playerDatas[socket.id].x, y: playerDatas[socket.id].y, carrying: socket.id})

						playerDatas[socket.id].carrying = false
					}
				}
			}
		});

	socket.on("moveCharacter", 
		function(direction)
		{
			//TODO: ARGUMENT CHECK!!

			//console.log("mvchr1 " + playerDatas[socket.id].nextMove + ", " + getTickCount());
			//console.log(playerDatas[socket.id].nextMove < getTickCount());
			//console.log(currentRoom)
			if(currentRoom && rooms[currentRoom].started && currentSpawnPoint >= 0 && playerDatas[socket.id] && playerDatas[socket.id].nextMove < getTickCount() && !playerDatas[socket.id].frozen)
			{
				//console.log("mvchr2 " + playerDatas[socket.id].nextMove + ", " + getTickCount());

				if((Math.abs(direction.x)+Math.abs(direction.y)) == 1)
				{
					if(direction.px != playerDatas[socket.id].x || direction.py != playerDatas[socket.id].y)
					{
						if(Math.abs(direction.px-playerDatas[socket.id].x) > 2 || Math.abs(direction.py-playerDatas[socket.id].y) > 2)
						{
							io.to(currentRoom).emit("teleportCharacter", {soc: socket.id, x: playerDatas[socket.id].x, y: playerDatas[socket.id].y})
						}
						else
						{
							playerDatas[socket.id].x = direction.px;
							playerDatas[socket.id].y = direction.py;
						}
					}

					var x = playerDatas[socket.id].x
					var y = playerDatas[socket.id].y

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

	 					if(x == playerDatas[socket.id].sx && y == playerDatas[socket.id].sy)
	 					{
	 						if(playerDatas[socket.id].carrying == 24)
	 						{
	 							rooms[currentRoom].gameover = "<font color='" + playerDatas[socket.id].color + "'>" + playerDatas[socket.id].name + "</font>";
	 							rooms[currentRoom].started = false;

	 							io.to(currentRoom).emit("bigText", {text: "Game over!<br><br>Winner: <font color='" + playerDatas[socket.id].color + "'>" + playerDatas[socket.id].name + "</font>", time: false, size: 0.5})
	 							io.to(currentRoom).emit("gameStarted", false)
	 						}
	 					}
	 					else if(roomStructures[currentRoom].roomCollisions[x] && roomStructures[currentRoom].roomCollisions[x][y] == "pickable" && !playerDatas[socket.id].carrying)
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
				if(!rooms[escapeHtml(data.name)])
				{
					if(data.num >= 2 && data.num <= 4)
					{
						createRoom(escapeHtml(data.name), data.num)
						socket.emit("chatMessage", "<font color='mediumseagreen'>Room '" + escapeHtml(data.name) + "' successfully created!</font>")
						
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
					socket.emit("chatMessage", "<font color='indianred'>Room with name '" + escapeHtml(data.name) + "' already exists!</font>")
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

	socket.on("leaveRoom",
		function(){
			if(currentRoom && !rooms[currentRoom].started && !rooms[currentRoom].cd)
			{
				console.log("user " + socket.id + " left room " + currentRoom)
				rooms[currentRoom].spawnPoints[currentSpawnPoint] = false

				socket.emit("leftRoom")

				socket.leave(currentRoom)

				refreshRoomPlayers(currentRoom)

				currentRoom = false;
				currentSpawnPoint = false;
				playerDatas[socket.id] = false;
			}
		})

	socket.on("disconnect", 
		function(){
			console.log("user " + socket.id + " disconnected, clients: " + clients + ", room:" + currentRoom);

			if(currentRoom)
			{
				console.log("user " + socket.id + " was in room " + currentRoom)
				rooms[currentRoom].spawnPoints[currentSpawnPoint] = false

				if(playerDatas[socket.id].carrying)
				{
					var id = createObject(currentRoom, playerDatas[socket.id].carrying, playerDatas[socket.id].x, playerDatas[socket.id].y);
					roomStructures[currentRoom].roomCollisions[playerDatas[socket.id].x][playerDatas[socket.id].y] = "pickable";
					roomStructures[currentRoom].pickables[playerDatas[socket.id].x][playerDatas[socket.id].y] = id

					io.to(currentRoom).emit("objectCreated", {id: playerDatas[socket.id].carrying, x: playerDatas[socket.id].x, y: playerDatas[socket.id].y})
				}

				refreshRoomPlayers(currentRoom)

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