/* model_user.js : Describes MongoDB schema models by Sion Lee */
var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	Name: String,		//User's name
	Birth: String,		//User's birth(yyyy-MM-dd)
	Age: Number,		//User's age
	AccountID: String,	//User's account ID
	AccountPW: String	//User's account PW(need crypto)
});

module.exports = mongoose.model('User', UserSchema);
