/* router_board.js : Includes routing functions in '/board' by Sion Lee */

var express = require('express');
var routers = express.Router();

var multer = require('multer');
var fs = require('fs');
var admzip = require('adm-zip');
var shell = require('shelljs');
var jwt = require('jsonwebtoken');
var parse = require('csv-parse/lib/sync');
var moment = require('moment');
//moment.locale('ko');

var User = require('../database/model_user.js');
var Project = require('../database/model_project.js');
var Label = require('../database/model_label.js');

const SECRETKEY = 'secretkey';

var storage = multer.diskStorage({
        destination: function(request, file, callback) {
                callback(null, 'project/');
        },
        filename: function(request, file, callback) {
                callback(null, file.originalname);
        }
});

var upload = multer({ storage: storage });


//Get project image file(zip) from user and save it
routers.post('/upload', upload.single('project'), function(request, response) {
	if (!fs.existsSync('project/' + request.file.filename)) {
		console.log('project/upload: Failed(result: 0)\t' + 'None of file');
		response.json({message: "파일 업로드에 실패했습니다. 다시 파일을 첨부해주세요", result: 0});
		return;
	}
	else {
		console.log('project/upload: Completed(result: 1)');
		console.log(request.file);
        response.json({result: 1});
	}
});


//Get project request from user and save the data to the database
routers.post('/save', function(request, response) {
	//Check json web token
	const token = request.headers['x-access-token'];
	var decoded;

	if(!token) {
        console.log('project/save: Failed(result: -1)\t' + 'None of JWT token');
		response.json({message: "재로그인이 필요합니다", result: -1});
		return;
	}
	
	try {
		decoded = jwt.verify(token, SECRETKEY);
	} catch(error) {
		console.log('project/save: Failed(result: -1)\t' + 'Wrong JWT token');
		response.json({message: "재로그인이 필요합니다", result: -1});
		return;
	}

	//Save project data into project model
    var project = new Project();
	var writer = decoded.user.AccountID;
	var date = moment();
    var filepath = '/root/workspace/project/' + writer + '/' + request.body.title;
	var filename = 'data_' + writer + '_' + request.body.title + '.zip';

	if (!fs.existsSync('project/' + filename)) {
		console.log('project/save: Failed(result: 0)\t' + 'None of project/' + filename);
		response.json({message: "라벨링 할 파일이 존재하지 않습니다. 다시 게시글을 작성해주세요", result: 0});
		return;
	}

	console.log(decoded);
    console.log(request.body);

    project.Title = request.body.title;
    project.Writer = writer;
	project.Type = request.body.type;
	project.Point = request.body.point;
	
	project.ContentText = request.body.contenttext;
    project.ContentImg = '\'' + filepath + '/contentimg\'';
    project.CorrectText = request.body.correcttext;
    project.CorrectImg = '\'' + filepath + '/correctimg\'';
    project.WrongText = request.body.wrongtext;
    project.WrongImg = '\'' + filepath + '/wrongimg\'';
	
	project.ClosingDate = date.add(Number(request.body.closingdate), 'days').format('LLL');
	project.Active = 1;

	console.log(project);

	//Make directories for project
	if(!fs.existsSync(filepath)) {
		fs.mkdirSync(filepath, {recursive: true});
		fs.mkdirSync(filepath + '/labeling');
		fs.mkdirSync(filepath + '/contentimg');
		fs.mkdirSync(filepath + '/correctimg');
		fs.mkdirSync(filepath + '/wrongimg');
		fs.mkdirSync(filepath + '/temp');
		fs.mkdirSync(filepath + '/result');
	}

	//Move the zip file to the project directory, unzip the file, and save the data to the database
	fs.copyFile('/root/workspace/labeler_server/server/project/' + filename, filepath + '/' + filename, function(error) {
		if(error) {
			console.log('project/save: Failed(result: 0)\t' + error.name + ': ' + error.message);
			console.log(error);
			return;
		}

		//Unzip the file
		shell.exec('unzip ' + '\'' + filepath + '/' + filename + '\'' + ' -d ' + '\'' + filepath + '\'');
		shell.exec('unzip ' + '\'' + filepath + '/labeling.zip\' -d ' + '\'' + filepath + '/labeling\'');
		shell.exec('unzip ' + '\'' + filepath + '/contentimg.zip\' -d ' + '\'' + filepath + '/contentimg\'');
		shell.exec('unzip ' + '\'' + filepath + '/correctimg.zip\' -d ' + '\'' + filepath + '/correctimg\'');
		shell.exec('unzip ' + '\'' + filepath + '/wrongimg.zip\' -d ' + '\'' + filepath + '/wrongimg\'');

		fs.unlink('/root/workspace/labeler_server/server/project/' + filename, function(error) {
			console.log('project/save: ' + filename + ' deleted');
			fs.unlink(filepath + '/labeling.zip', function (error) {
				console.log('project/save: ' + filename + '/labeling.zip deleted');
			});
			fs.unlink(filepath + '/contentimg.zip', function (error) {
				console.log('project/save: ' + filename + '/contentimg.zip deleted');
			});
			fs.unlink(filepath + '/correctimg.zip', function (error) {
				console.log('project/save: ' + filename + '/correctimg.zip deleted');
			});
			fs.unlink(filepath + '/wrongimg.zip', function (error) {
				console.log('project/save: ' + filename + '/wrongimg.zip deleted');
			});
		});
		

		//Save the labeling data into database
		if(project.Type == 0) { //Image collection
			project.TotalProcess = request.body.filenum;

			if(decoded.user.Point >= project.TotalProcess * request.body.point) {
				project.save(function(error) {
					if(error) {
						console.log('project/save: Failed(result: 0)\t' + 'Image collection -' + error.name + ': ' + error.message);
						response.json({message: '오류가 발생했습니다', result: 0});
						return;
					}
					User.updateOne({AccountID: decoded.user.AccountID}, {$push: {MyProject: project.Title}, $inc: {Point: -project.TotalProcess * request.body.point}}, function(error, user_u) {
						if(error) {
							console.log('project/save: Failed(result: 0)\t' + 'Image collection -' + error.name + ': ' + error.message);
							response.json({message: '오류가 발생했습니다', result: 0});
							return;
						}
						console.log('project/save: Completed(result: 1)');
						console.log(project);
						response.json({result: 1});
						return;
					});
				});
			}
			else {
				console.log('project/save: Failed(result: 0)\t' + 'Lack of user point: ' + decoded.user.Point);
				response.json({message: '포인트가 부족합니다', result: 0});
				return;
			}
		}

		else if(project.Type == 1) { //Image classification
			var img = new Label.Label_Img();

			img.Writer = project.Writer;
			img.Title = project.Title;
			img.Index = 0;
			img.Count = 0;

			request.body.objects.forEach(obj => {
				img.Objects.push(obj);
				fs.mkdirSync(filepath + '/result/' + obj);
			});
			fs.mkdirSync(filepath + '/result/none');

			fs.readdir(filepath + '/labeling', function(error, files) {
				if(error) {
					console.log('project/save: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
					response.json({message: '오류가 발생했습니다', result: 0});
					return;
				}
				project.TotalProcess = files.length;
					
				if(decoded.user.Point >= project.TotalProcess * request.body.point) {
					project.save(function(error) {
						if(error) {
							console.log('project/save: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
							console.log(error.name + ': ' + error.message);
							response.json({message: '오류가 발생했습니다', result: 0});
							return;
						}
						img.save(function(error) {
							if(error) {
								console.log('project/save: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생했습니다', result: 0});
								return;
							}
							User.updateOne({AccountID: decoded.user.AccountID}, {$push: {MyProject: project.Title}, $inc: {Point: -project.TotalProcess * request.body.point}}, function(error, user_u) {
								if(error) {
									console.log('project/save: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
									response.json({message: '오류가 발생했습니다', result: 0});
									return;
								}
								console.log('project/save: Completed(result: 1)');
								response.json({result: 1});
								return;
							});
						});
					});
				}
				else {
					console.log('project/save: Failed(result: 0)\t' + 'Lack of user point: ' + decoded.user.Point);
					response.json({message: '포인트가 부족합니다', result: 0});
					return;
				}
			});
		}

		else if(project.Type == 2) { //Bounding box
			var img = new Label.Label_Img();

			img.Writer = project.Writer;
			img.Title = project.Title;
			img.Format = request.body.format;

			request.body.objects.forEach(obj => {
				img.Objects.push(obj);
			});

			fs.readdir(filepath + '/labeling', function(error, files) {
				if(error) {
					console.log('project/save: Failed(result: 0)\t' + 'Bounding box -' + error.name + ': ' + error.message);
					response.json({message: '오류가 발생했습니다', result: 0});
					return;
				}
				project.TotalProcess = files.length;

				if(decoded.user.Point >= project.TotalProcess * request.body.point) {
					project.save(function(error) {
						if(error) {
							console.log('project/save: Failed(result: 0)\t' + 'Bounding box -' + error.name + ': ' + error.message);
							response.json({message: '오류가 발생했습니다', result: 0});
							return;
						}
						img.save(function(error) {
							if(error) {
								console.log('project/save: Failed(result: 0)\t' + 'Bounding box -' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생했습니다', result: 0});
								return;
							}
							User.updateOne({AccountID: decoded.user.AccountID}, {$push: {MyProject: project.Title}, $inc: {Point: -project.TotalProcess * request.body.point}}, function(error, user_u) {
								if(error) {
									console.log('project/save: Failed(result: 0)\t' + 'Bounding box -' + error.name + ': ' + error.message);
									response.json({message: '오류가 발생했습니다', result: 0});
									return;
								}
								console.log('project/save: Completed(result: 1)');
								response.json({result: 1});
								return;
							});
						});
					});
				}
				else {
					console.log('project/save: Failed(result: 0)\t' + 'Lack of user point: ' + decoded.user.Point);
					response.json({message: '포인트가 부족합니다', result: 0});
					return;
				}
			});
		}

		else if(project.Type == 3) { //Text labeling
			var text = new Label.Label_Text();

			text.Writer = project.Writer;
			text.Title = project.Title;
			text.Index = 0;
			request.body.objects.forEach(obj =>
				text.Objects.push(obj)
			);
			
			fs.readFile(filepath + '/labeling/data.csv', 'utf-8', function(error, data) {
				if(error) {
					console.log('project/save: Failed(result: 0)\t' + 'Text labeling -' + error.name + ': ' + error.message);
					response.json({message: '오류가 발생하였습니다', result: 0});
					return;
				}
				var record = parse(data, {skip_empty_lines: true});
				project.TotalProcess = record.length;
			
				if(decoded.user.Point >= project.TotalProcess * request.body.point) {
					project.save(function(error) {
						if(error) {
							console.log('project/save: Failed(result: 0)\t' + 'Text labeling -' + error.name + ': ' + error.message);
							response.json({message: '오류가 발생했습니다', result: 0});
							return;
						}
						text.save(function(error) {
							if(error) {
								console.log('project/save: Failed(result: 0)\t' + 'Text labeling -' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생하였습니다', result: 0});
								return;
							}
							User.updateOne({AccountID: decoded.user.AccountID}, {$push: {MyProject: project.Title}, $inc: {Point: -project.TotalProcess * request.body.point}}, function(error, user_u) {
								if(error) {
									console.log('project/save: Failed(result: 0)\t' + 'Text labeling -' + error.name + ': ' + error.message);
									response.json({message: '오류가 발생했습니다', result: 0});
									return;
								}
								console.log('project/save: Completed(result: 1)');
								response.json({result: 1});
								return;
							});
						});				
					});
				}
				else {
					console.log('project/save: Failed(result: 0)\t' + 'Lack of user point: ' + decoded.user.Point);
					response.json({message: '포인트가 부족합니다', result: 0});
					return;
				}
			});
		}
	});
});


//Download the result file when the project is over
routers.post('/download', function(request, response) {
	//Check json web token
	const token = request.headers['x-access-token'];
	var decoded;

	if(!token) {
		console.log('project/download: Failed(result: -1)\t' + 'None of JWT token');
		response.json({message: "재로그인이 필요합니다", result: -1});
		return;
	}

	try {
		decoded = jwt.verify(token, SECRETKEY);
	} catch(error) {
		console.log('project/download: Failed(result: -1)\t' + 'Wrong JWT token');
		response.json({message: "재로그인이 필요합니다", result: -1});
		return;
	}

	//Check writer's accountid and accountpw
	Project.findOne({Title: request.body.title, Writer: decoded.user.AccountID}, function(error, project) {
		if(error) {
			console.log('project/download: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: "오류가 발생하였습니다", result: 0});
			return;
		}
		if(project.Active == 0) {
			var date = moment();
			var file = 'result_' + project.Writer + '_' + project.Title + '.zip';
			var dir = '/root/workspace/project/' + project.Writer + '/' + project.Title;
			var zip = new admzip();

			zip.addLocalFolder(dir + '/result');
			var link = zip.toBuffer();
				
			//Can download result file up to 3 days after the deadline(closingdate)
			if(date.diff(moment(project.ClosingDate), 'days') < 3) {
				zip.writeZip(dir + '/result/' + file, function(error) {
					if(error) {
						console.log('project/download: Failed(result: 0)\t' + error.name + ': ' + error.message);
						response.json({message: '파일 생성에 실패하였습니다', result: 0});
						return;
					}
					console.log('project/download: Completed(download)');
					//response.redirect('server IP address' + project.Writer + '/'+ project.Title + '/result/' + file);
					return;
				});
			}
			else {
				Project.remove({Title: project.Title, Writer: project.Writer}, function(error, output) {
					if(error) {
						console.log('project/download: Failed(result: 0)\t' + error.name + ': ' + error.message);
						response.json({message: '오류가 발생하였습니다', result: 0});
						return;
					}
					if(project.Type == 1 || project.Type == 2) {
						Label.Label_Img.remove({Title: project.Title, Writer: project.Writer}, function(error, output) {
							if(error) {
								console.log('project/download: Failed(result: 0)\t' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생하였습니다', result: 0});
								return;
							}
							console.log('project/download: Failed(result: 2)\t' + 'Download duration over');
							response.json({message: '파일 다운로드 기간이 지났습니다', result: 2});
							return;
						});
					}
					else if(project.Type == 3) {
						Label.Label_Text.remove({Title: project.Title, Writer: project.Writer}, function(error, output) {
							if(error) {
								console.log('project/download: Failed(result: 0)\t' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생하였습니다', result: 0});
								return;
							}
							response.json({message: '파일 다운로드 기간이 지났습니다', result: 2});
							return;
						});
					
						/*fs.rmdir(dir, { recursive: true, }, function(error) {
							if(error) {
							console.log(error.name + ': ' + error.message);
							response.json({message: '오류가 발생하였습니다', result: 0});
								return;
							}
						});*/
					};
				});
			}
		}
		else {
			response.json({message: "마감되지 않은 프로젝트 입니다", result: 0});
			return;
		}
	});
});

module.exports = routers;
