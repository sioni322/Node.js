/* model_user.js : Describes user schema models by Sion Lee */
var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	Name: {type: String, required: true},						//User's name
	Birth: {type: String, default: ' '},						//User's birth
	PhoneNumber: {type: String, default: ' '},					//User's phone number
	Point: {type: Number, default: 50000},						//User's labeling point
	MyProject: {type: [String]},								//User's project(writer of project)
	JoinedProject: {type: [String]},							//User's participated project(participiant of project)

	AccountID: {type: String, required: true},					//User's account ID
	AccountPW: {type: String, required: true}					//User's account PW(crypo need to be applied)
});

module.exports = mongoose.model('User', UserSchema);
