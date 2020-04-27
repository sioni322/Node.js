/* router_user.js : Includes routing functions in '/user' by Sion Lee  */

var express = require('express');
var routers = express.Router();
var User = require('../database/model_user.js');
//var crypto = require('../modules/module_crypto.js')


routers.get('/', function(request, response) {
	response.send('User space');
});


//Create new user account
routers.post('/new', function(request, response) {
	var user = new User();

	user.Name = request.body.name;
	user.Birth = new Date(request.body.birth);
	user.PhoneNumber = request.body.phonenumber;
	user.AccountID = request.body.accountid;
	user.AccountPW = request.body.accountpw;

	console.log(request.body);
	console.log(user);

	user.save(function(error) {
		if(error) {
			console.log('DB: Failed to create user account, ' + error);
			response.json({message: 'DB 오류가 발생하였습니다', result: 0});
			return;
		}
		else
			response.json({message: '회원가입을 축하드립니다!', result: 1});
	});
});


//Check AccountID for creating new account
routers.post('/new/check', function(request, response) {
	User.findOne({AccountID: request.body.accountid}, function(error, exist_user) {
		if(error) {
			console.log('DB: Failed to retrieve account ID, ' + error);
			response.json({message: 'DB 오류가 발생하였습니다', result: 0});
			return;
		}
		if(!(exist_user == null)) {
			console.log('DB: Already existing account ID, ' + error);
			response.json({message: '이미 존재하는 아이디 입니다', result: 0});
			return;
		}
		else {
			response.json({message: '사용 가능한 아이디 입니다', result: 1});
			return;
		}
	});
});


//Delete user account using AccountID & AccountPW
routers.delete('/del', function(request, response) {
	User.remove({AccountID: request.body.accountid, AccountPW: request.body.accountpw}, function(error, output) {
		if(error) {
			console.log('DB: Failed to delete user account, ' + error);
			response.status(500).json({message: 'DB 오류가 발생하였습니다', result: 0});
			return;
		}
			response.status(204).json({message: '계정 삭제가 완료되었습니다', result: 1});
	});
});


//Login to account
routers.post('/login', function(request, response) {
	User.findOne({AccountID: request.body.accountid}, function(error, user) {
		console.log(request.body);
		
		if(error) {
			console.log('DB: Failed to retrieve account ID, ' + error);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}
		if(user == null) {
			console.log('DB: Failed to access the account');
			response.json({message: '존재하지 않는 아이디 입니다', result: 0});
			return;
		}

		if(user.AccountPW != request.body.accountpw) {
			console.log('DB: Failed to login(Wrong password)');
			response.json({message: '잘못된 비밀번호 입니다', result: 0});
			return;
		}
		else {
			response.json({message: '안녕하세요, '+user.AccountID+'님!', result: 1});
			return;
		}
	});
});

module.exports = routers;
