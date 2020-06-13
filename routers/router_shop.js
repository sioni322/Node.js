/* router_shop.js : Includes routing functions in '/shop' by Sion Lee  */

var express = require('express');
var routers = express.Router();
var jwt = require('jsonwebtoken');

var User = require('../database/model_user.js');

const SECRETKEY = 'secretkey'


//Load user's point
routers.use('/load', function(request, response) {
    //Check json web token
    const token = request.headers['x-access-token'];
    var decoded;

    if(!token) {
        console.log('shop/load: Failed(result: -1)\t' + 'None of JWT token');
        response.json({message: "재로그인이 필요합니다", result: -1});
        return;
    }

    try {
        decoded = jwt.verify(token, SECRETKEY);
    } catch(error) {
        console.log('shop/load: Failed(result: -1)\t' + 'Wrong JWT token');
        response.json({message: "재로그인이 필요합니다", result: -1});
        return;
    }
    
	//Find user with JWT token information and return user information
	User.findOne({AccountID: decoded.user.AccountID, AccountPW: decoded.user.AccountPW}, function(error, user) {
		if(error) {
			console.log('shop/load: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}
		var res = {};
		res['point'] = user.Point;
		res['result'] = 1;

        console.log('shop/load: Completed(result: 1)');
		response.json(res);
		return;
	});
});

module.exports = routers;
