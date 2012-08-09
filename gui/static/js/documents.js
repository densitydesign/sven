var query = new svenjs.Sven("");  //svenjs.Sven("http://127.0.0.1:8000");  


query.getDocuments(function(response){

    var data = response.results; 
	var dataTable = sven.utils.datatable()
		.data(d3.values(data))
		.target("#documents-list")
		.keys(function(d){ return ['id','date','title','actors','language']; })
		.highlight(function(d){ return ['title']; })
		.handle("actors", function(d){ return d.value.map(function(v){return v.name;}).join(","); })
		.handle("title", function(d){ return "<a href='/gui/documents/"+ d.id +"'>" + d.value + "</a>" })
		.on("click",function(d){
			//window.location = "http://127.0.0.1:8000/gui/documents/" + d;
		})
		.update()
	
	},args);
