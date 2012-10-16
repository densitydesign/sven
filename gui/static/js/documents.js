var query = new svenjs.Sven("");  //svenjs.Sven("http://127.0.0.1:8000");  

var corpusID;
var deleteList;
var deletedFile;

/* Check if any corpuses exist */

query.getCorpora(function(response){
	
	/* Error */
	if ( response.status != "ok" ){
		d3.select("#sven-alert")
			.attr("class","alert alert-block alert-error")
		d3.select("#sven-alert")
			.append("h4")
			.html("Whoops!")
		d3.select("#sven-alert")
			.append("p")
			.html("Sorry, but something wrong happened:" + response.errors)
		return;
	}
	
	/* No corpus */
	if ( !response.results.length ){
		d3.select("#sven-alert")
			.attr("class","alert alert-block")
			.append("h4")
			.html("No corpus found!")
		
		d3.select("#sven-alert")
			.append("p")
			.html("You need to create a corpus for your documents.")
		
		d3.select("#documents-list")
			.style("display","none")
				
		d3.select("#documents-corpus")
			.style("display","block")
			
		
		// TODO:DA SISTEMARE ERRORI SULLA RISPOSTA....
		d3.select("#create-corpus")
			.on("click", function(){

				var corpusData = {}
				corpusData['name'] = d3.select("#corpus-name").property("value")
				console.log(corpusData)
				query.addCorpus(function(r){
					
					window.location.reload();
					
				}, corpusData)
				
			})
			
		return;
	}
	
	corpusID = response.results[0].id;
	
	checkStatus();
})

	// get actors
	
	query.getActors(function(response){
		console.log(response);
		var actorList = response.objects;
		d3.select(".filterActors").selectAll("label.checkbox")
		.data(actorList)
		.enter()
		.append("label")
		.attr("class", "checkbox")
		.text(function(d){return d.name;})
		.append("input")
		.attr("type", "checkbox")
		
		
		});

function getDocumentsList(){
	//var args = {};
	args['corpus'] = corpusID;
	query.getDocuments(function(response){

	    var data = response.objects; 
		var dataTable = sven.utils.datatable()
			.data(d3.values(data))
			.target("#documents-list")
			.keys(function(d){ return ['id','date','title','actors','language']; })
			.highlight(function(d){ return ['title']; })
			.handle("actors", function(d){ return d.actors.map(function(v){return v.name;}).join(","); })
			.handle("title", function(d){ return "<a href='/gui/documents/"+ d.id +"'>" + d.title + "</a>" })
			.update()
		
		//d3.select("#checked").on("click", function(){console.log(d3.selectAll(".datatable-selected > .datatable-check").data())})
		dataTable.on("selected", function(){
		
			
			
			
			deleteList = d3.selectAll(".datatable-selected > .datatable-check").data();
			console.log(deleteList.length);
			if (deleteList.length > 0){
				
				d3.select("#delete")
					.attr("style","display:inline")
				
				d3.select("#delete").text("delete (" + deleteList.length + ")")
				
			}else{
				d3.select("#delete")
					.attr("style","display:none")
				
			}
		
		})
	

		
	var langList = d3.nest()
    .key(function(d) { return d.language; })
    .entries(data);
    
    d3.select(".filterLang").selectAll("label.checkbox")
		.data(langList)
		.enter()
		.append("label")
		.attr("class", "checkbox")
		.text(function(d){return d.key;})
		.append("input")
		.attr("type", "checkbox")
	
	//datepicker
	$('#alert').hide();
	var startDate = new Date(2012,1,20);
			var endDate = new Date(2012,1,25);
			$('#dp1').datepicker()
				.on('changeDate', function(ev){
					if (ev.date.valueOf() > endDate.valueOf()){
						$('#alert').show().find('strong').text('The start date can not be greater then the end date');
					} else {
						$('#alert').hide();
						startDate = new Date(ev.date);
						$('#startDate').text($('#dp1').data('date'));
					}
					$('#dp1').datepicker('hide');
				});
			$('#dp2').datepicker()
				.on('changeDate', function(ev){
					if (ev.date.valueOf() < startDate.valueOf()){
						$('#alert').show().find('strong').text('The end date can not be less then the start date');
					} else {
						$('#alert').hide();
						endDate = new Date(ev.date);
						$('#endDate').text($('#dp2').data('date'));
					}
					$('#dp2').datepicker('hide');
				});
	//end datepicker
	
	//apply filters
	d3.select("#filter").append("button")
		.attr("class", "btn btn-mini btn-success")
		.text("Apply filters")
		.on("click", function(){console.log($('#dp1').data('date'))})
	
	var filters = {};
	filters["date__gte"] = $('#dp1').data('date') + "T00:00";
	filters["date__lte"] = $('#dp2').data('date') + "T00:00";
	filters["title__icontains"] = d3.select("#filterContains").property("value");
	filters["tags__id__in"]
	},args);
}


// let's check if there is any analysis going


function checkStatus(){
	
	query.status(corpusID,function(response){
		
		getDocumentsList();
		
		var status = true;
		
		response.objects.forEach(function(d){
			if (d.status != "OK")
				status = false;			
		})
				
		if ( !response.objects.length || status )
			return;
		
		
		var progress = response.objects[0].completion * 100;
		console.log(progress+"%")
				
		d3.select("#sven-alert")
			.attr("class","alert alert-block")
	
		d3.select("#sven-alert")
			.append("h4")
			.html("Warning!")
	
		d3.select("#sven-alert")
			.append("div")
			.attr("class","pull-right progress progress-striped progress-warning active")
			.style("display","block")
			.style("margin-bottom","0px")
			.append("div")
			.attr("class","bar")
			.style("width", progress + "%")
	
		d3.select("#sven-alert")
			.append("p")
			.html("Documents analysis is currently ongoing. Please wait until the analysis is complete. It should take some minutes. Refresh this page.")
			
		
	})
}


				//query.exportEntities(corpusID,function(response){
				//	
				//	})
				
			
 $('#export')
      .click(function () {
        var btn = $(this);
        btn.button('loading');
        query.exportEntities(corpusID, function(response){
        	window.location = response;
        	btn.button('reset');
        	});

      })
      

 $('#delete').click(function(){
 		d3.select("#deleteAlert .modal-gallery")
	 		.selectAll(".file-info")
			.remove()
	 	
	 	deletedFile = [];
	 	
	 	$('#deleteAlert').modal();
	 	

      d3.select("#deleteAlert .modal-gallery").selectAll("div")
					.data(deleteList)
					.enter()
					.append("div")
					.attr("class",function(d,i){return "file-info bold " + "del_" + i})
					.text(function(d, i){
						return i+1 + ". " + d.title;
					})
		
		d3.select("#deleteAlert .modal-upload")
		      		.style("display","inline")
					.on("click",function(){
						 var btn = $(this);
        				
        				
						for ( i in deleteList){
						btn.button('loading');
							var id = deleteList[i].id
							query.deleteDocument(id, function(response){
								
								if (response.status == "ok"){
									btn.button('reset');
									d3.select("#deleteAlert .del_" + i)
									.append("span")
									.attr("class","label label-success")
									.style("display","inline")
									.style("margin-top","5px")
									.text("Deleted")
									
									deletedFile.push(id);
									deleteList.splice(0,1);
									console.log(deleteList);
									
									}
									else{console.log(response);
									d3.select("#deleteAlert .del_" + i)
									.append("span")
									.attr("class","label label-danger")
									.style("display","inline")
									.style("margin-top","5px")
									.text("Error")
									}
								
							});
							
							}
					})
		
		
		/* When finishing delating... */
		
       $('#deleteAlert').on('hidden',function(){
			
			if (!deletedFile.length)
				return;
			var args = {}
			//args['limit'] = uploadedFiles.length;
			query.startAnalysis(corpusID, function(response){
				
				console.log(response);
				window.location.reload()
				
			}, args)
			
			
		})
 	
	 })
