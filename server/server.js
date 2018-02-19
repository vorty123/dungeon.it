var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res){
	res.send('<h1>dungeon.it server</h1>');
});

var port = 3030

http.listen(port, function(){
	console.log('listening on *:' + port);
});

var io = require('socket.io')(http);

var clients = 0

var rooms = {}

rooms["Teszt szoba"] = {
	neededPlayers: 3,
	currentPlayers: 0,
	started: false,
}
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

function getCurrentRoom(socket)
{
	var rooms = Object.keys(socket.rooms).filter(item => item!=socket.id)

	if(rooms.length > 0)
		return rooms[0]
	else
		return false
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

	socket.on('joinRoom', 
		function(room){
			console.log("tryin: " + rooms)
			if(!getCurrentRoom(socket) && rooms[room] && getRoomUsers(room) < rooms[room].neededPlayers && !rooms[room].started)
			{
				socket.join(room)
				refreshRoomPlayers(room)

				console.log("user joined room: " + room + ", users in room: " + rooms[room].currentPlayers)
			}
		});

	socket.on('disconnect', 
		function(){
			clients --;

			console.log('user disconnected, clients: ' + clients);

			var room = getCurrentRoom(socket);

			if(room)
			{
				console.log("user was in room " + room)
				refreshRoomPlayers(room)
			}
		});
});