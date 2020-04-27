/* model_user.js : Describes MongoDB schema models by Sion Lee */
var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	Name: {type: String, required: true},				//User's name
	Birth: {type: String},						//User's birth
	PhoneNumber: {type: String},					//User's phone number
	Point: {type: Number, default: 0},				//User's labeling point
	AccountID: {type: String, required: true},			//User's account ID
	AccountPW: {type: String, required: true}			//User's account PW(crypo applied)
});

module.exports = mongoose.model('User', UserSchema);
