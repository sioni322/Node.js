/* router_user.js : Includes routing functions in '/user' by Sion Lee  */

var express = require('express');
var routers = express.Router();
var User = require('../database/models/model_user.js');


routers.get('/', function(request, response) {
	response.send('User space');
});


//Create new user account
routers.post('/new', function(request, response) {
	var user = new User();

	user.Name = request.body.name;
	user.Birth = new Date(request.body.birth);
	user.Age = request.body.age;
	user.AccountID = request.body.accountid;
	user.AccountPW = request.body.accountpw;

	console.log(request.body);
	console.log(user);

	User.find({AccountID: user.AccountID}, function(error, user) {
		if(error) {
			console.log('DB: Failed to retrieve account ID, ' + error);
			response.json({error: 'Failed to retrieve account ID', result: 0});
			return;
		}
		if(!(user.length === 0)) {
			console.log('DB: Already existing account ID, ' + error);
			response.json({error: 'Already existing account ID', result: 0});
			return;
		}
	});

	user.save(function(error) {
		if(error) {
			console.log('DB: Failed to create user account, ' + error);
			response.json({error: 'Failed to create user account', result: 0});
			return;
		}
		else
			response.json({result: 1});
	});
});

//Delete user account using AccountID & AccountPW
routers.delete('/del', function(request, response) {
	User.remove({AccountID: request.body.accountid, AccountPW: request.body.accountpw}, function(error, output) {
		if(error) {
			console.log('DB: Failed to delete user account, ' + error);
			response.status(500).json({error: 'Failed to delete user account', result: 0});
			return;
		}
			response.status(204).json({result: 1});
	});
});

module.exports = routers;
