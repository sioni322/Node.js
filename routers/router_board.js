/* router_board.js : Includes routing functions in '/board' by Sion Lee */

var express = require('express');
var routers = express.Router();
var fs = require('fs');
var moment = require('moment');
moment.suppressDeprecationWarnings = true;
//moment.locale('ko');

var Project = require('../database/model_project.js');


//Check project before load the projects
routers.use('/load/check', function(request, response) {
	Project.find({}, function(error, project) {
		if(error) {
			console.log('board/load/check: Failed(result: 0)\t' + error.name + ': ' + error.message);
			response.json({message: '오류가 발생하였습니다', result: 0});
			return;
		}

		project.forEach(projects => {
			var date = moment();

			//Check project's closing date
			if(moment.duration(date.diff(moment(projects.ClosingDate))).asMilliseconds() >= 0) {
				Project.updateOne(projects, {$set: {Active: 0}}, function(error, project_u) {
					if(error) {
						console.log('board/load/check: Failed(result: 0)\t' + error.name + ': ' + error.message);
						response.json({message: '오류가 발생하였습니다', result: 0});
						return;
					}
				});
			}
		});
		console.log('board/load/check: Completed(result: 1)');
		response.json({result: 1});
	});
});

//Load simple project data
routers.use('/load', function(request, response) {
        Project.find({Active: 1}, function(error, project) {
                if(project == null) {
						console.log('board/load: Failed(result: 0)\t' + 'None of project');
                        response.json({message: '등록된 프로젝트가 없습니다', result: 0});
                        return;
				}
                else {
					var total_list = [];
					project.forEach(p => {
						var date = moment(p.ClosingDate).format('YYYY년 M월 D일 H시 m분');
						total_list.push({title:p.Title, writer:p.Writer, contenttext:p.ContentText, TotalProcess:p.TotalProcess, CurrentProcess:p.CurrentProcess, closingdate:date});
					});

					console.log('board/load: Completed(result: 1)');
					console.log(total_list);
        		    response.json({project:total_list, result: 1});    
					return;
                }
        });
});


//Load detail project data
routers.post('/detail', function(request, response) {
	var res = {};

    fs.readdir(__dirname + '/../../project/' + request.body.writer + '/' + request.body.title + '/contentimg', (error, files) => {
        if(error) {
			console.log('board/detail: Failed(result: 0)\t' + error.name + ': ' + error.message);
    	    response.json({message: '이미지를 불러오지 못했습니다', result: 0});
       	}
    	if (files.length != 0) {
     		var contentimg = {};
    		var index = 0;

       		files.forEach(file => {
                contentimg[index] = file;
        		index++;
     		});
      		res['contentimg'] = contentimg;
            		
			fs.readdir(__dirname + '/../../project/' + request.body.writer + '/' + request.body.title + '/correctimg', (error, files) => {
           		if(error) {
					console.log('board/detail: Failed(result: 0)\t' + error.name + ': ' + error.message);
          			response.json({message: '이미지를 불러오지 못했습니다', result: 0});
         		}
             	if(files.length != 0) {
           			var correctimg = {};
        			var index = 0;
                    			
					files.forEach(file => {
        	   			correctimg[index] = file;
            			index++;
           			});
                    			
					res['correctimg'] = correctimg;
                    			
					fs.readdir(__dirname + '/../../project/' + request.body.writer + '/' + request.body.title + '/wrongimg', (error, files) => {
                        if(error) {
							console.log('board/detail: Failed(result: 0)\t' + error.name + ': ' + error.message);
              				response.json({message: '이미지를 불러오지 못했습니다', result: 0});
              			}
             		 	if(files.length != 0) {
                        	var wrongimg = {};
                        	var index = 0;
                            				
							files.forEach(file => {
                   				wrongimg[index] = file;
                            	index++;
                        	});
                            				
							res['wrongimg'] = wrongimg;
                     
							Project.findOne({Title: request.body.title, Writer: request.body.writer}, function(error, project) {
								if(error) {
									console.log('board/detail: Failed(result: 0)\t' + error.name + ': ' + error.message);
									response.json({message: '올바르지 않은 제목/작성자 입니다', result: 0});
									return;
								}
								else {
									project_list = {title: project.Title, writer: project.Writer, type: project.Type,
										contenttext: project.ContentText, correcttext: project.CorrectText, wrongtext: project.WrongText,}
									res['db'] = project_list;
								
									console.log('board/detail: Completed(result: 1)');
									console.log(project_list);
									response.json(res);
								}
							});
						
                        }
                    });
                }
            });
        }
    });
});


module.exports = routers;

