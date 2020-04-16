/* routers.js : Includes routing method by Sion Lee  */

var express = require('express');
var routers = express.Router();
var User = require('../database/models/models.js');


routers.get('/', function(request, response) {
	response.send('Hello');
});

routers.get('/about', function(request, response) {
	response.send('This web server is made by Node.js -Sion Lee-');
});

routers.get('/about/:name', function(request, response) {
	console.log(request.params.name);
	response.json({result: 1});
});

//Create new user account
routers.post('/user/new', function(request, response) {
	var user = new User();

	console.log(request.body);

	user.Name = request.body.name;
	user.Birth = new Date(request.body.birth);
	user.Age = request.body.age;
	user.AccountID = request.body.accountid;
	user.AccountPW = request.body.accountpw;

/*	User.find({AccountID: user.AccountID}, function(error, user) {
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
*/
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
routers.delete('/user/del', function(request, response) {
	User.remove({AccountID: request.body.accountid, AccountPW: request.body.accountpw}, function(error, output) {
		if(error) {
			console.log('DB: Failed to delete user account, ' + error);
			response.status(500).json({error: 'Failed to delete user account', result: 0});
			return;
		}
		if(!output.result.n) {
			console.log('DB: Failed to find user account, ' + error);
			response.status(404).json({error: 'Failed to find user account', result: 0});
			return;
		}
			response.status(204).json({result: 1});
	});
});

module.exports = routers;
