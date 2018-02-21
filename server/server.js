var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res){
	res.send('<h1>dungeon.it server</h1>');
});

var port = 8080

http.listen(port, function(){
	console.log('listening on *:' + port);
});

var io = require('socket.io')(http);

var clients = 0

var rooms = {}
var roomStructures = {}

rooms["Teszt szoba"] = {
	neededPlayers: 3,
	currentPlayers: 0,
	started: false,
}

roomStructures["Teszt szoba"] = {
	bites: [],
	objects: [],
}

function randomBetween(min, max)
{
	return Math.floor((Math.random() * (max-min+1)) + min);
}

function generateBites(room)
{
	var disabled = [...Array(21).keys()].map(i => Array(21))
	 
	console.log("generating bite in room: " + room)
	//generateBiteInMap(y, dir, xsize, yize)
	var currY = 1;
	
	var num = randomBetween(1,3);
	
	for(var i=0; i<num; i++)
	{
		var sY = randomBetween(currY, num*18/num);
		var ySize = randomBetween(2, 5);
		
		if(sY + ySize >= 20)
		{
			break;
		}
		
		var bite = {
			y: sY,
			dir: 1,
			xsize: randomBetween(1, 4),
			ysize: ySize,
		}
		
		roomStructures[room].bites.push(bite)
		
		currY = sY+ySize+1
		
		console.log("generate bite: dir1, " + sY + ", " + ySize)
		
		if(currY > 20)
		{
			break;
		}
	}
	
	var currY = 1;
	
	var num = randomBetween(1,3);
	
	for(var i=0; i<num; i++)
	{
		var sY = randomBetween(currY, num*18/num);
		var ySize = randomBetween(2, 5);
		
		if(sY + ySize >= 20)
		{
			break;
		}
		
		var bite = {
			y: sY,
			dir: 2,
			xsize: randomBetween(1, 4),
			ysize: ySize,
		}	
		
		roomStructures[room].bites.push(bite)
		
		currY = sY+ySize+1
		
		console.log("generate bite: dir2, " + sY + ", " + ySize)
		
		if(currY > 20)
		{
			break;
		}
	}
	
	var obj = {
		id: 24,
		x: 10,
		y: 10,
	} //chest
	
	roomStructures[room].objects.push(obj);
	disabled[10][10] = true;
	
	var objs = randomBetween(10, 20);
	
	for(var i=0; i<objs; i++)
	{
		var x = randomBetween(1, 19);
		var y = randomBetween(1, 19);
		
		if(!disabled[x][y])
		{
			var obj = {
				id: 26,
				x: x,
				y: y,
			}
			
			roomStructures[room].objects.push(obj);
			disabled[x][y] = true;
		}
	}
}

generateBites("Teszt szoba")

io.emit("roomList", rooms)

function getRoomUsers(room) {
	if(io.nsps['/'].adapter.rooms[room])
		return io.nsps['/'].adapter.rooms[room].length
	else
		return 0
}

function isRoomExists(room) {
	return (io.nsps['/'].adapter.rooms[room] || rooms[room])
}

function refreshRoomPlayers(room)
{
	rooms[room].currentPlayers = getRoomUsers(room)
	io.emit("roomList", rooms)
}

io.on('connection', function(socket){
	clients ++;

	socket.emit("roomList", rooms)

	console.log('user connected, clients: ' + clients);

	var currentRoom = false;
	
	socket.on('joinRoom', 
		function(room){
			console.log("user trying to join: " + room)
			if(!currentRoom && rooms[room] && getRoomUsers(room) < rooms[room].neededPlayers && !rooms[room].started)
			{
				currentRoom = room;
				
				socket.join(room);
				refreshRoomPlayers(room);
				socket.emit("sendRoomStructure", roomStructures[room]);
				
				console.log("user joined room: " + room + ", users in room: " + rooms[room].currentPlayers)
			}
		});

	socket.on('disconnect', 
		function(){
			clients --;

			console.log('user disconnected, clients: ' + clients + ", room:" + currentRoom);

			if(currentRoom)
			{
				console.log("user was in room " + currentRoom)
				refreshRoomPlayers(currentRoom)
			}
		});
});