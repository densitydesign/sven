var query = new svenjs.Sven("");  //svenjs.Sven("http://127.0.0.1:8000");  

var corpusID;

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


function getDocumentsList(){
	var args = {};
	args['corpus'] = corpusID;
	query.getDocuments(function(response){

	    var data = response.results; 
		var dataTable = sven.utils.datatable()
			.data(d3.values(data))
			.target("#documents-list")
			.keys(function(d){ return ['id','date','title','actors','language']; })
			.highlight(function(d){ return ['title']; })
			.handle("actors", function(d){ return d.actors.map(function(v){return v.name;}).join(","); })
			.handle("title", function(d){ return "<a href='/gui/documents/"+ d.id +"'>" + d.title + "</a>" })
			.update()
	
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



