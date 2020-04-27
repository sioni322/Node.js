/* server.js : Start Node.js server program with port# 8080, by Sion Lee */


//Import modules & packages
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var db = mongoose.connection;
var bodyparser = require('body-parser');


//Run database
db.on('error', function() {
	console.log('DB: Failed to connect MongoDB');
});
db.once('open', function() {
	console.log('DB: MongoDB is running......');
});

mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://localhost/',
	{
		useNewUrlParser : true,
		useUnifiedTopology : true
	});


//Define model
var User = require('../database/model_user.js');


//Configure bodyparser
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());


//Define router
var router = require('../routers/router_user.js');
app.use('/user', router);



//Run server
var server = app.listen(8080, function() {
	console.log('Server: Server is running......');
});
