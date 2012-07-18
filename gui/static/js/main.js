
var query = new svenjs.Sven("http://127.0.0.1:8000");  
var data;
query.getDocuments(function(response){

    data = response.results; 
	var dataTable = sven.utils.datatable()
		.data(d3.values(data))
		.target("#documents-list")
		.keys(function(d){ return ['id','date','title']; })
		.update()
	
	},args);
/*
d3.select("#documents-list")
	.selectAll("div")
	.data(d3.entries(data.documents))
		.enter().append("div")
		.attr("class","document-div")
		.html(function(d){ return d.value.title + " - " + d.value.ACTOR })
*/


/*
$.ajax({
	url : "/api/documents",
	success: function(data){
		var documents = data.documents;
		
		console.log(documents)
		
		d3.select("#documents-list")
			.selectAll("div")
			.data(d3.entries(documents))
				.enter().append("div")
				.html(function(d){ return d.value.title })
	}
})
*/