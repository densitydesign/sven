
var query = new svenjs.Sven("http://127.0.0.1:8000");  

query.getDocument(id_document, function(response){

    var data = response; 
    var status = data.status
    if (status == 'ko'){
    	$("#documents-list").text(data.error + ", error: " + data.errorCode);
    	}
    else {
    	var text = response.text;
    	var date = response.results[0].date;
    	var title = response.results[0].title;
    	var actor = response.results[0].tags[0].name;
    	$(".doc_preview").text(text);
    	$(".doc_title").text(title);
    	$(".doc_date").text(date);
    	$(".doc_actors").text(actor);
    	}
	console.log(response)
		
	},args);
