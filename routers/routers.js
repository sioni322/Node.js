/* routers.js : Includes routing method by Sion Lee  */

module.exports = function(app, User) {
	app.get('/', function(request, response) {
		response.send('Hello');
	});

	app.get('/about', function(request, response) {
		response.send('This web server is made by Node.js -Sion Lee-');
	});

	app.get('/db/user', function(request, response) {
		User.find(function(error, users) {
			if(error) {
				return response.status(500).send({error: 'Database failure'});
			}

			response.json(users);
		});

	});

	app.get('db/user/:name', function(request, response) {
		User.findOne({Name: request.params.name}, function(error, users) {
			if(error) {
				return response.status(500).json({error: err});
			}
			if(!users) {
				return response.status(404).json({error: 'User not found'});
			}
			response.json(users);
		});
	});

	app.post('db/user', function(request, response) {
		var user = new User();
		user.Name = request.body.name;
		user.Birth = new Date(request.body.birth);
		user.Age = request.body.age;
		user.AccountID = request.body.accountid;
		user.AccountPW = request.body.accountpw;

		user.save(function(error) {
			if(error) {
				console.log('Database: Save failed, ' + error);
				response.json({result: 0});
				return;
			}
			res.json({result: 1});
		});
	});

	app.put('db/user/:name', function(request, response) {
		User.findById(request.params.name, function(error, users) {
			if(error) {
				return response.status(500).json({error: 'Database failure'});
			}
			if(!book) {
				return response.status(404).json({error: 'User not found'});
			}

			users.Name = request.body.name;
			users.Birth = request.body.birth;
			users.Age = request.body.age;
		});
	});

	app.delete('/db/user/:name', function(request, response) {
		User.remove({ID: request.params.name}, function(error, users) {
			if(error) {
				return response.status(500).json({error: 'Database failure'});
			}
			if(!users.result.n) {
				return response.status(404).json({error: 'User not found'});
			}
			response.json({message: 'User deleted'});
			response.status(204).end();
		})
	});
	
}
