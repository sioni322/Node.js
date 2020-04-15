/* server.js : Start Node.js server program with port# 8080, by Sion Lee */

//Import modules & packages
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var db = mongoose.connection;
var User = require('../database/models/models.js');
var router = require('../routers/routers.js')(app, User);

app.use(express.json());
mongoose.connect('mongodb://localhost/test', 
	{useNewUrlParser: true
	,useUnifiedTopology: true});


//Run database
db.on('error', function() {
	console.log('DB: Failed to connect MongoDB');
});
db.once('open', function() {
	console.log('DB: MongoDB is running......');
});

//Run server
var server = app.listen(8080, function() {
	console.log('Server: Server is running......');
});
