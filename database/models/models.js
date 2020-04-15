/* models.js : Describes MongoDB schema models by Sion Lee */
var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	Name: String,
	Birth: Date,
	Age: Number,
	AccountID: String,
	AccountPW: String
});

module.exports = mongoose.model('User', UserSchema);
