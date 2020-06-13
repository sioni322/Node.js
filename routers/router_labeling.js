/* router_labeling.js : Includes routing functions in '/label' by Sion Lee */

var express = require('express');
var routers = express.Router();

var multer = require('multer');
var fs = require('fs');
var shell = require('shelljs');
var jwt = require('jsonwebtoken');
var parse = require('csv-parse/lib/sync');
var path = require('path');
var moment = require('moment');

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


//Send the information to the user for labeling
routers.post('/start', function(request, response) {
	Project.findOne({Title: request.body.title, Writer: request.body.writer}, function(error, project) {
		if(error) {
			console.log('label/start: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '해당 프로젝트가 존재하지 않습니다. 다시 시도해 주세요', result: 0});
			return;
		}
		else if(project.Active == 0) {
			console.log('label/start: Failed(result: 0)\t' + 'Project inactivated');
			response.json({message: '만료된 프로젝트입니다', result: 0});
			return;
		}
		else if(project.CurrentProcess >= project.TotalProcess) {
			Project.updateOne({Title: project.Title, Writer: project.Writer}, {$set: {Active: 0}}, function(error, project_u) {
				if(error) {
					console.log('label/start: Failed(result: 0)\t' + error.name + ': ' + error.message);
					response.json({message: '오류가 발생하였습니다', result: 0});
					return;
				}
				console.log('label/start: Failed(result: 0)\t' + 'End of labeling');
				response.json({message: '모든 파일을 불러왔습니다', result: 2});
				return;
			});
		}
		//Find image&text files in project directory and send the location of files
		else {
			var dir = '/root/workspace/project/' + project.Writer + '/' + project.Title + '/labeling';
			var fnum;

			switch(project.Type) {
				case 1: fnum = 4; break;	//Image classification
				case 2: fnum = 1; break;	//Bounding box
			}

			//Image collection
			if(project.Type == 0) {
				console.log('label/start: Completed(result: 1)');
				response.json({result: 1});
				return;
			}

			//Image Classification
			else if(project.Type == 1) {
				Label.Label_Img.findOne({Title: project.Title, Writer: project.Writer}, function(error, img) {
					if(img.Index % 2 == 0) {
						//Read the labeling directory and find image files
						fs.readdir(dir, {withFileTypes: true}, function(error, files) {
							if(error) {
								console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생했습니다. 다시 시도해 주세요', result: 0});
								return;
							}
							//End the labeling if it is reached to the end of object
							if(img.Index >= img.Objects.length) {
								Project.updateOne({Title: project.Title, Writer: project.Writer}, {$set: {Active: 0}}, function(error, project_u) {
									if(error) {
										console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
										response.json({message: '오류가 발생하였습니다', result: 0});
										return;
									}
									if(files.length > 0) {
										files.forEach(file => {
											fs.renameSync(dir + '/' + file.name, dir + '/../result/none/' + file.name);
										});
									}
									fs.readdir(dir + '/../temp', {withFileTypes: true}, function(error, files_temp) {
										if(error) {
											console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
											response.json({message: '오류가 발생하였습니다', result: 0});
											return;
										}
										if(files_temp.length > 0) {
											files_temp.forEach(file => {
												fs.renameSync(dir + '/../temp/' + file.name, dir + '/../result/none/' + file.name);
											});
										}
									});
									console.log('label/start: Completed(result: 2)\t' + 'End of labeling');
									response.json({message: '라벨링이 완료되었습니다', result: 2});
									return;
								});
							}
							//Proceed the process otherwise
							else {
								var res = {};
								var res_files = new Array();

								if(files.length > 0) {
									files.some(file => {
										if(fnum == 0)
											return true;	//break
										if(file.isDirectory())
											return false;	//continue
				
										res_files.push(file.name);
										fnum -= 1;
									});
					
									var filenum = 4-fnum;

									console.log(files.length);
									console.log(filenum);
									res['files'] = res_files;
									res['result'] = 1;

									res_files.forEach(file => {
										fs.renameSync(dir + '/' + file, dir + '/../temp/' + file);
									});

									//Check remained labeling files in labeling directory
									//Set the count value for the first time
									if(img.Count == 0) {
										if(files.length - filenum == 0) {
											Label.Label_Img.updateOne({Title: img.Title, Writer: img.Writer}, {$set: {Count: 0, Index: img.Index+1}}, function(error, img_u) {
												if(error) {
													console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
													response.json({message: '오류가 발생하였습니다', result: 0});
													return;
												}
												res['objects'] = img.Objects[img.Index];
			
												console.log(res);
												response.json(res);
												return;
											});
										}
										else {
											Label.Label_Img.updateOne({Title: img.Title, Writer: img.Writer}, {$set: {Count: files.length-filenum}}, function(error, img_u) {
												if(error) {
													console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
													response.json({message: '오류가 발생하였습니다', result: 0});
													return;
												}
												res['objects'] = img.Objects[img.Index];
			
												console.log(res);
												response.json(res);
												return;
											});
										}
									}
									//Set the count value when count equals zero
									else if(img.Count-filenum == 0) {
										Label.Label_Img.updateOne({Title: img.Title, Writer: img.Writer}, {$set: {Count: 0, Index: img.Index+1}}, function(error, img_u) {
											if(error) {
												console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
												response.json({message: '오류가 발생하였습니다', result: 0});
												return;
											}
											res['objects'] = img.Objects[img.Index];
											
											console.log(res);
											response.json(res);
											return;
										});
									}
									//Set the count value otherwise
									else {
										Label.Label_Img.updateOne({Title: img.Title, Writer: img.Writer}, {$inc: {Count: -filenum}}, function(error, img_u) {
											if(error) {
												console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
												response.json({message: '오류가 발생하였습니다', result: 0});
												return;
											}
											res['objects'] = img.Objects[img.Index];
	
											console.log(res);
											response.json(res);
											return;
										});
									}
								}
							}
						});
					}
					else {
						//Read the temp directory and find image files
						var tempdir = '/root/workspace/project/' + project.Writer + '/' + project.Title + '/temp'

						fs.readdir(tempdir, {withFileTypes: true}, function(error, files) {
							if(error) {
								console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생했습니다. 다시 시도해 주세요', result: 0});
								return;
							}
							//End the labeling if it is reached to the end of object
							if(img.Index >= img.Objects.length) {
								Project.updateOne({Title: project.Title, Writer: project.Writer}, {$set: {Active: 0}}, function(error, project_u) {
									if(error) {
										console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
										response.json({message: '오류가 발생하였습니다', result: 0});
										return;
									}
									if(files.length > 0) {
										files.forEach(file => {
											fs.renameSync(tempdir + '/' + file.name, dir + '/../result/none/' + file.name);
										});
									}
									fs.readdir(dir, {withFileTypes: true}, function(error, files_l) {
										if(error) {
											console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
											response.json({message: '오류가 발생하였습니다', result: 0});
											return;
										}
										if(files_l.length > 0) {
											files_l.forEach(file => {
												fs.renameSync(dir + '/' + file.name, dir + '/../result/none/' + file.name);
											});
										}
									});
									console.log('label/start: Completed(result: 2)\t' + 'End of labeling');
									response.json({message: '라벨링이 완료되었습니다', result: 2});
									return;
								});
							}
							//Proceed the process otherwise
							else {
								//Find out labeling files(# of fnum)
								var res = {};
								var res_files = new Array();

								//Check file #
								if(files.length > 0) {
									files.some(file => {
										if(fnum == 0)
											return true;	//break
										if(file.isDirectory())
											return false;	//continue
				
										res_files.push(file.name);
										fnum -= 1;
									});

									var filenum = 4-fnum;
									res['files'] = res_files;
									res['result'] = 1;

									res_files.forEach(file => {
										fs.renameSync(tempdir + '/' + file, tempdir + '/../labeling/' + file);
									});

									//Check remained labeling files in temp directory
									//Set the count&index value for the first time
									if(img.Count == 0) {
										if(files.length - filenum == 0) {
											Label.Label_Img.updateOne({Title: img.Title, Writer: img.Writer}, {$set: {Count: 0, Index: img.Index+1}}, function(error, img_u) {
												if(error) {
													console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
													response.json({message: '오류가 발생하였습니다', result: 0});
													return;
												}
												res['objects'] = img.Objects[img.Index];
			
												console.log('label/start: Completed(result: 1)\t' + 'Labeling data sended');
												console.log(res);
												response.json(res);
												return;
											});
										}
										else {
											Label.Label_Img.updateOne({Title: img.Title, Writer: img.Writer}, {$set: {Count: files.length-filenum}}, function(error, img_u) {
												if(error) {
													console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
													response.json({message: '오류가 발생하였습니다', result: 0});
													return;
												}
												res['objects'] = img.Objects[img.Index];
			
												console.log('label/start: Completed(result: 1)\t' + 'Labeling data sended');
												console.log(res);
												response.json(res);
												return;
											});
										}		
									}
									//Set the count value when count equals zero
									else if(img.Count-filenum == 0) {
										Label.Label_Img.updateOne({Title: img.Title, Writer: img.Writer}, {$set: {Count: 0, Index: img.Index+1}}, function(error, img_u) {
											if(error) {
												console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
												response.json({message: '오류가 발생하였습니다', result: 0});
												return;
											}
											res['objects'] = img.Objects[img.Index];

											console.log('label/start: Completed(result: 1)\t' + 'Labeling data sended');
											console.log(res);
											response.json(res);
											return;
										});
									}
									//Set the count value
									else {
										Label.Label_Img.updateOne({Title: img.Title, Writer: img.Writer}, {$inc: {Count: -filenum}}, function(error, img_u) {
											if(error) {
												console.log('label/start: Failed(result: 0)\t' + 'Image classification -' + error.name + ': ' + error.message);
												response.json({message: '오류가 발생하였습니다', result: 0});
												return;
											}
											res['objects'] = img.Objects[img.Index];

											console.log('label/start: Completed(result: 1)\t' + 'Labeling data sended');
											console.log(res);
											response.json(res);
											return;
										});
									}
								}
							}
						});
					}
				});
			}

			//Bounding box
			else if(project.Type == 2) {
				//Read the directory and find image files
				fs.readdir(dir, {withFileTypes: true}, function(error, files) {
					if(error) {
						console.log('label/start: Failed(result: 0)\t' + 'Bounding box -' + error.name + ': ' + error.message);
						response.json({message: '오류가 발생했습니다. 다시 시도해 주세요', result: 0});
						return;
					}
					//Find out labeling files(# of fnum)
					var res = {};
					var res_files = new Array();

					//If there are some image files in directory
					if(files.length) {
						files.some(file => {
							if(fnum == 0)
								return true;	//break
							if(file.isDirectory())
								return false;	//continue
	
							res_files.push(file.name);
							fnum -= 1;
						});
						Label.Label_Img.findOne({Writer: project.Writer, Title: project.Title}, function(error, label_img) {
							if(error) {
								console.log('label/start: Failed(result: 0)\t' + 'Bounding box -' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생하였습니다', result: 0});
								return;
							}
				
							res['files'] = res_files;
							res['result'] = 1;
							res['format'] = label_img.Format;
							res['objects'] = [];
								
							label_img.Objects.forEach(obj => {
								res['objects'].push(obj);
							});	

							res_files.forEach(file => {
								fs.renameSync(dir + '/' + file, dir + '/../temp/' + file);
							});

							console.log('label/start: Completed(result: 1)\t' + 'Labeling data sended');
							response.json(res);
							return;
						});
					}
					//If there is none of file in directory
					else {
						Project.updateOne({Title: project.Title, Writer: project.Writer}, {$set: {Active: 0}}, function(error, project_u) {
							if(error) {
								console.log('label/start: Failed(result: 0)\t' + 'Bounding box -' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생하였습니다', result: 0});
								return;
							}
							console.log('label/start: Completed(result: 2)\t' + 'End of labeling');
							response.json({message: '모든 파일을 불러왔습니다', result: 2});
							return;
						});
					}
				});
			}

			//Text labeling
			else if(project.Type == 3) {
				//Read the csv file and response labeling data
				Label.Label_Text.findOne({Title: project.Title, Writer: project.Writer}, function(error, text) {
					if(error) {
						console.log('label/start: Failed(result: 0)\t' + 'Text labeling -' + error.name + ': ' + error.message);
						response.json({message: '라벨링 데이터가 존재하지 않습니다', result: 0});
						return;
					}

					fs.readFile(dir + '/data.csv', 'utf-8', function(error, data) {
						if(error) {
							console.log('label/start: Failed(result: 0)\t' + 'Text labeling -' + error.name + ': ' + error.message);
							response.json({message: '오류가 발생하였습니다', result: 0});
							return;
						}
						var record = parse(data, {skip_empty_lines: true});

						Label.Label_Text.updateOne({Title: text.Title, Writer: text.Writer}, {$inc : {Index: 1}}, function(error, text_u) {
							if(error) {
								console.log('label/start: Failed(result: 0)\t' + 'Text labeling -' + error.name + ': ' + error.message);
								response.json({message: '오류가 발생하였습니다', result: 0});
								return;
							}
							var res = {};
							res['text'] = record[text.Index].toString('utf-8');
							res['index'] = text.Index;
							res['objects'] = text.Objects;
							res['result'] = 1;

							console.log('label/start: Completed(result: 1)\t' + 'Labeling data sended');
							console.log(res);								
							response.json(res);
							return;
						});
					});
				});
			}
		}
	});
});


//Receive labeling result from user and save it
//Image Collection
routers.post('/end/0', upload.single('label'), function(request, response) {
	//Check json web token
	const token = request.headers['x-access-token'];
	var decoded;

	if(!token) {
		console.log('label/end/0: Failed(result: -1)\t' + 'None of JWT token');
		response.json({message: '재로그인이 필요합니다', result: -1});
		return;
	}

	try {
		decoded = jwt.verify(token, SECRETKEY);
	} catch(error) {
		console.log('label/end/0: Failed(result: -1)\t' + 'Wrong JWT token');
		response.json({message: '재로그인이 필요합니다', result: -1});
		return;
	}

	Project.findOne({Title: request.body.title, Writer: request.body.writer}, function(error, project) {
		if(error) {
			console.log('label/end/0: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}
		var dir = '/root/workspace/project/' + request.body.writer + '/' + request.body.title;

		//Extract zip files to project directory
		shell.exec('unzip ' + '\'project/' + request.file.filename + '\' -d \'' + dir + '/temp/\'');
		shell.exec('rm ' + '\'project/' + request.file.filename + '\'');

		fs.readdir(dir + '/temp/', function(error, files) {
			if(error) {
				console.log('label/end/0: Failed(result: 0)\t' + error.name + ': ' + error.message);
				response.json({message: '오류가 발생하였습니다', result: 0});
				return;
			}
			files.forEach(files_rename => {
				fs.renameSync(dir + '/temp/' + files_rename, dir + '/result/' + moment().format('YYYYMMDDhmmssSSS') + files_rename);
			});

			//Update data
			Project.updateOne({Title: project.Title, Writer: project.Writer}, {$inc: {CurrentProcess: request.body.filenum}}, function(error, project_u) {
				if(error) {
					console.log('label/end/0: Failed(result: 0)\t' + error.name + ': ' + error.message);
					response.json({message: '오류가 발생하였습니다', result: 0});
					return;
				}
				User.updateOne({AccountID: decoded.user.AccountID, AccountPW: decoded.user.AccountPW}, {$inc: {Point: request.body.filenum * project.Point}, $addToSet: {JoinedProject: project.Title}}, function(error, user_u) {
					if(error) {
						console.log('label/end/0: Failed(result: 0)\t' + error.name + ': ' + error.message);
						response.json({message: '오류가 발생하였습니다', result: 0});
						return;
					}
					console.log('label/end/0: Completed(result: 1)\t');
					response.json({result: 1});
					return;
				});
			});
		});
	});
});


//Image classification
routers.post('/end/1', function(request, response) {
	//Check json web token
	const token = request.headers['x-access-token'];
	var decoded;

	if(!token) {
		console.log('label/end/1: Failed(result: -1)\t' + 'None of JWT token');
		response.json({message: '재로그인이 필요합니다', result: -1});
		return;
	}

	try {
		decoded = jwt.verify(token, SECRETKEY);
	} catch(error) {
		console.log('label/end/1: Failed(result: -1)\t' + 'Wrong JWT token');
		response.json({message: '재로그인이 필요합니다', result: -1});
		return;
	}
	
	if(request.body.name === []) {
		console.log('label/end/1: Completed(result: 1)\t');
		response.json({result: 1});
		return;
	}

	Project.findOne({Title: request.body.title, Writer: request.body.writer}, function(error, project) {
		if(error) {
			console.log('label/end/1: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}
		var dir = '/root/workspace/project/' + request.body.writer + '/' + request.body.title;

		Label.Label_Img.findOne({Title: project.Title, Writer: project.Writer}, function(error, label_img) {
			if(error) {
				console.log('label/end/1: Failed(result: 0)\t' + error.name + ': ' + error.message);
				response.json({message: '오류가 발생하였습니다', result: 0});
				return;
			}

			//Migrate selected files to the specific directory
			if(label_img.Index % 2 == 0) {
				if(label_img.Count == 0) {
					request.body.name.forEach(filename => {
						fs.renameSync(dir + '/labeling/' + filename, dir + '/result/' + request.body.objects + '/' + filename);
					});
				}
				else {
					request.body.name.forEach(filename => {
						fs.renameSync(dir + '/temp/' + filename, dir + '/result/' + request.body.objects + '/' + filename);
					});
				}
			}
			else {
				if(label_img.Count == 0) {
					request.body.name.forEach(filename => {
						fs.renameSync(dir + '/temp/' + filename, dir + '/result/' + request.body.objects + '/' + filename);
					});
				}
				else {
					request.body.name.forEach(filename => {
						fs.renameSync(dir + '/labeling/' + filename, dir + '/result/' + request.body.objects + '/' + filename);
					});
				}
			}

			//Update data
			Project.updateOne({Title: project.Title, Writer: project.Writer}, {$inc: {CurrentProcess: request.body.name.length}}, function(error, project_u) {
				if(error) {
					console.log('label/end/1: Failed(result: 0)\t' + error.name + ': ' + error.message);
					response.json({message: '오류가 발생하였습니다', result: 0});
					return;
				}
				User.updateOne({AccountID: decoded.user.AccountID, AccountPW: decoded.user.AccountPW}, {$inc: {Point: request.body.name.length * project.Point}, $addToSet: {JoinedProject: project.Title}}, function(error, user_u) {
					if(error) {
						console.log('label/end/1: Failed(result: 0)\t' + error.name + ': ' + error.message);
						response.json({message: '오류가 발생하였습니다', result: 0});
						return;
					}

					console.log('label/end/1: Completed(result: 1)');
					response.json({result: 1});
					return;
				});
			});
		});
	});
});

//Bounding box
routers.post('/end/2', function(request, response) {
	//Check json web token
	const token = request.headers['x-access-token'];
	var decoded;

	if(!token) {
		console.log('label/end/2: Failed(result: -1)\t' + 'None of JWT token');
		response.json({message: '재로그인이 필요합니다', result: -1});
		return;
	}

	try {
		decoded = jwt.verify(token, SECRETKEY);
	} catch(error) {
		console.log('label/end/2: Failed(result: -1)\t' + 'Wrong JWT token');
		response.json({message: '재로그인이 필요합니다', result: -1});
		return;
	}

	//Find project and save the labeling data
	Project.findOne({Title: request.body.title, Writer: request.body.writer}, function(error, project) {
		if(error) {
			console.log('label/end/2: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}
		var dir = '/root/workspace/project/' + request.body.writer + '/' + request.body.title;
		var file = path.parse(request.body.name).name;

		//Write labeling data
		fs.writeFile(dir + '/result/' + file + '.txt', request.body.content, function(error) {
			if(error) {
				console.log('label/end/2: Failed(result: 0)\t' + error.name + ': ' + error.message);
				response.json({message: '오류가 발생하였습니다', result: 0});
				return;
			}
			fs.renameSync(dir + '/temp/' + request.body.name, dir + '/result/' + request.body.name);
					
			//Update data
			Project.updateOne({Title: project.Title, Writer: project.Writer}, {$inc : {CurrentProcess: 1}}, function(error, project_u) {
				if(error) {
					console.log('label/end/2: Failed(result: 0)\t' + error.name + ': ' + error.message);
					response.json({message: '오류가 발생하였습니다', result: 0});
					return;
				}
				User.updateOne({AccountID: decoded.user.AccountID, AccountPW: decoded.user.AccountPW}, {$inc: {Point: project.Point}, $addToSet: {JoinedProject: project.Title}}, function(error, user_u) {
					if(error) {
						console.log('label/end/2: Failed(result: 0)\t' + error.name + ': ' + error.message);
						response.json({message: '오류가 발생하였습니다', result: 0});
						return;
					}

					console.log('label/end/2: Completed(result: 1)');
					response.json({result: 1});
					return;
				});
			});
		});
	});
});

//Text labeling
routers.post('/end/3', function(request, response) {
	//Check json web token
	const token = request.headers['x-access-token'];
	var decoded;

	if(!token) {
		response.json({message: "재로그인이 필요합니다", result: -1});
		return;
	}

	try {
		decoded = jwt.verify(token, SECRETKEY);
	} catch(error) {
		response.json({message: "재로그인이 필요합니다", result: -1});
		return;
	}

	Project.findOne({Title: request.body.title, Writer: request.body.writer}, function(error, project) {
		if(error) {
			console.log('label/end/3: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}

		var dir = '/root/workspace/project/' + request.body.writer + '/' + request.body.title;

		//Write labeling data to result.csv
		fs.appendFile(dir + '/result/result.csv', request.body.objects + ',\"' + request.body.text + '\"\n', function(error) {
			if(error) {
				console.log('label/end/3: Failed(result: 0)\t' + error.name + ': ' + error.message);
				response.json({message: '오류가 발생하였습니다', result: 0});
				return;
			}
			
			//Update data
			Project.updateOne({Title: project.Title, Writer: project.Writer}, {$inc: {CurrentProcess: 1}}, function(error, project_u) {
				if(error) {
					console.log('label/end/3: Failed(result: 0)\t' + error.name + ': ' + error.message);
					response.json({message: '오류가 발생하였습니다', result: 0});
					return;
				}
				User.updateOne({AccountID: decoded.user.AccountID, AccountPW: decoded.user.AccountPW}, {$inc: {Point: project.Point}, $addToSet: {JoinedProject: project.Title}}, function(error, user_u) {
					if(error) {
						console.log('label/end/3: Failed(result: 0)\t' + error.name + ': ' + error.message);
						response.json({message: '오류가 발생하였습니다', result: 0});
						return;
					}

					console.log('label/end/3: Completed(result: 1)');
					response.json({result: 1});
					return;
				});
			});
		});
	});
});

module.exports = routers;

