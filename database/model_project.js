/* model_project.js : Describes project schema models by Sion Lee */
var mongoose = require('mongoose');

var ProjectSchema = new mongoose.Schema({
	Title: {type: String, required: true, default: ''},				//Project name
	Writer: {type: String, required: true},							//Project owner

	Type: {type: Number, required: true},							//Project labeling type (1: Image classification, 2: Bounding box, 3: Text labeling)

	Point: {type: Number, required: true},							//Project labeling point(per one labeling)

	TotalProcess: {type: Number, required: true, default: 0},		//Project's total labeling #
	CurrentProcess: {type: Number, required: true, default: 0},		//Project's current labeling #
	ClosingDate: {type: String, required: true},					//Project's end date
	
	Active : {type: Number, required: true},						//Project activation

	ContentText: {type: String, required: true, default: ''},		//Project content text
    ContentImg: {type: String},										//Project content image
	CorrectText: {type: String, required: true, default: ''},		//Project correct example text
	CorrectImg: {type: String, default: ''},						//Project correct example image
	WrongText: {type: String, required: true, default: ''},			//Project wrong example text
	WrongImg: {type: String, default: ''},							//Project wrong example image

});

module.exports = mongoose.model('Project', ProjectSchema);
