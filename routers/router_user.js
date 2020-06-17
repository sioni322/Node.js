/* router_user.js : Includes routing functions in '/user' by Sion Lee  */

var express = require('express');
var routers = express.Router();
var jwt = require('jsonwebtoken');
var moment = require('moment');

var User = require('../database/model_user.js');
var Project = require('../database/model_project.js');

const SECRETKEY = 'secretkey'


//Create new user account
routers.post('/new', function(request, response) {
	var user = new User();

	user.Name = request.body.name;
	user.Birth = String(request.body.birth);
	user.PhoneNumber = request.body.phonenumber;
	user.AccountID = request.body.accountid;
	user.AccountPW = request.body.accountpw;

	user.save(function(error) {
		if(error) {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/new: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: 'DB 오류가 발생하였습니다', result: 0});
			return;
		}
		console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/new: Completed(result: 1)');
		response.json({message: '회원가입을 축하드립니다!', result: 1});
	});
});


//Check AccountID for creating new account
routers.post('/new/check', function(request, response) {
	User.findOne({AccountID: request.body.accountid}, function(error, exist_user) {
		if(error) {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/new/check: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: 'DB 오류가 발생하였습니다', result: 0});
			return;
		}
		if(!(exist_user == null)) {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/new/check: Failed(result: 0)\t' + 'Already existing AccountID');
			response.json({message: '이미 존재하는 아이디 입니다', result: 0});
			return;
		}
		else {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/new/check: Completed(result: 1)');
			response.json({message: '사용 가능한 아이디 입니다', result: 1});
			return;
		}
	});
});


//Login to account
routers.post('/login', function(request, response) {
	User.findOne({AccountID: request.body.accountid, AccountPW: request.body.accountpw}, function(error, user) {
		if(error) {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/login: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}
		if(user == null) {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/login: Failed(result: 0)\t' + 'No account');
			response.json({message: '존재하지 않는 아이디 입니다', result: 0});
			return;
		}

		if(user.AccountPW != request.body.accountpw) {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/login: Failed(result: 0)\t' + 'Wrong password');
			response.json({message: '잘못된 비밀번호 입니다', result: 0});
			return;
		}
		else {
			jwt.sign({user}, SECRETKEY, {expiresIn:'1d'}, function(error, token) {
				if(error) {
					console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/login: Failed(result: 0)\t' + 'JWT sign failed');
					response.json({message: '회원가입에 실패하였습니다', result:0});
					return;
				}
				//console.log(request.headers['x-forwarded-for'] || request.connection.remoteAddress);
				console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/login: Completed(result: 1)');
				console.log('user: ' + user.AccountID + '(' + user.Name + ')');
				response.json({jwt : token, message: '안녕하세요, ' + user.AccountID + '님!', result:1});
				return;
			});
		}
	});
});


//Delete user account using AccountID & AccountPW
routers.delete('/del', function(request, response) {
	User.remove({AccountID: request.body.accountid, AccountPW: request.body.accountpw}, function(error, output) {
		if(error) {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') +  '\tuser/del: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: 'DB 오류가 발생하였습니다', result: 0});
			return;
		}
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/del: Completed(result: 1)');
			response.json({message: '계정 삭제가 완료되었습니다', result: 1});
			return;
	});
});


//Show user's information
routers.use('/mypage', function(request, response) {
	//Check json web token
	const token = request.headers['x-access-token'];
	var decoded;

	if(!token) {
		console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/mypage: Failed(result: -1)\t' + 'None of JWT token');
		response.json({message: "재로그인이 필요합니다", result: -1});
		return;
	}

	try {
		decoded = jwt.verify(token, SECRETKEY);
	} catch(error) {
		console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/mypage: Failed(result: -1)\t' + 'Wrong JWT token');
		response.json({message: "재로그인이 필요합니다", result: -1});
		return;
	}

	//Find user with JWT token information and return user information
	User.findOne({AccountID: decoded.user.AccountID, AccountPW: decoded.user.AccountPW}, function(error, user) {
		if(error) {
			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/mypage: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}
		Project.find({Writer: user.AccountID}, function(error, project) {
			if(error) {
				console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/mypage: Failed(result: 0)\t' + error.name + ': ' + error.message);
				response.json({message: '오류가 발생하였습니다', result: 0});
				return;
			}
			var res = {};

			var myproject_list = {};
			myproject_list['project'] = [];
			myproject_list['active'] = [];
			project.forEach(projects => {
				myproject_list['project'].push(projects.Title);
				myproject_list['active'].push(projects.Active); 
			});

			var user_info = {accountid: user.AccountID, birth: user.Birth, phonenumber: user.PhoneNumber,
			point: user.Point, myproject: myproject_list, joinedproject: user.JoinedProject};

			res['user'] = user_info;
			res['result'] = 1;

			console.log(moment().format('YYYY.MM.DD HH:mm:ss') + '\tuser/mypage: Completed(result: 1)\t');
			response.json(res);
			return;
		});
	});
});

module.exports = routers;
