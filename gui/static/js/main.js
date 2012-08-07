var query = new svenjs.Sven("http://127.0.0.1:8000");  


query.getDocuments(function(response){

    var data = response.results; 
	var dataTable = sven.utils.datatable()
		.data(d3.values(data))
		.target("#documents-list")
		.keys(function(d){ return ['id','date','title','actors','language']; })
		.on("click",function(d){ console.log(d.id) })
		.update()
	
	},args);


