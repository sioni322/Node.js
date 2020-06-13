/* model_label.js : Describes labeling schema models by Sion Lee */
/* Used for specific labeling that database is required */
var mongoose = require('mongoose');

var LabelTextSchema = new mongoose.Schema({
	Writer: {type: String, required: true},						//Text labeling project's writer
	Title: {type: String, required: true},						//Text labeling project title
	Index: {type: Number, required: true},						//Text line number(index)
	Objects: {type: [String]}									//Text labeling objects
});

var LabelImgSchema = new mongoose.Schema({
	Writer: {type: String, required: true},						//Image labeling project's writer
	Title: {type: String, required: true},						//Image labeling project title
	Index: {type: Number},										//Image labeling cycle(for image classification)
	Count: {type: Number},										//Number of remained files in directory(for image classification)
	Objects: {type: [String]},									//Image labeling objects
	Format: {type: Boolean}										//Image labeling format(for bounding box)
});

module.exports = {
	Label_Text: mongoose.model('Label_Text', LabelTextSchema),
	Label_Img: mongoose.model('Label_Img', LabelImgSchema)
}
