var query = new svenjs.Sven("");  //svenjs.Sven("http://127.0.0.1:8000");  


var deleteList;
var deletedFile;
var nextLimit;
var nextOffset;
var total;

// TODO:DA SISTEMARE ERRORI SULLA RISPOSTA....
d3.select("#create-corpus").on("click", function(){

	var corpusData = {}
	corpusData['name'] = d3.select("#corpus-name").property("value")
	query.addCorpus(function( data ){ switchCorpus( data.object.id );},corpusData);

})


/* Check if any corpuses exist */

query.getCorpora(function(response){

	var corpora = response.objects;

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
	if ( !corpora.length ){
		d3.select("#sven-alert")
		.attr("class","alert alert-block")
		.append("h4")
		.html("No corpus found!")
		
		d3.select("#sven-alert")
		.append("p")
		.html("You need to create a corpus for your documents.")
		
		d3.select("#documents-list")
		.style("display","none")

		return;
	}
	
	
	d3.select(".corpus-list").append("p")
	.attr("class", "filter-title")
	.text("Change corpus")
	
	console.log(args['corpus']);
	
	d3.select(".corpus-list")
	.append("select")
	.attr("class", "span8")
	.selectAll("option")
	.data(corpora)
	.enter()
	.append("option")
	.text(function(d){return d.name})
	.attr("value", function(d){return d.id})
	.attr("selected", function(d){if(d.id == args['corpus']){return "selected"}})
	
	$(".corpus-list select").change(function(){
		var id = $(this+":selected").attr("value");
		console.log(id);
		switchCorpus(id);
	})

		//table corpus
	nextLimit = response.meta.next.limit;
	nextOffset = response.meta.next.offset;
	total = response.meta.total_count;
	args['limit'] = nextLimit;
	args['offset'] = nextOffset;
	var data = response.objects; 
	var dataTable = sven.utils.datatable()
		.data(d3.values(data))
		.target("#documents-list")
		.keys(function(d){ return ['id','name']; })
		.highlight(function(d){ return ['name']; })
		//.handle("actors", function(d){ return d.actors.map(function(v){return v.name;}).join(", "); })
		//.handle("title", function(d){ return "<a href='/gui/documents/"+ d.id +"'>" + d.title + "</a>" })
		.update()
		
	dataTable.on("selected", function(d){
			
			console.log(d3.select(".datatable-main").selectAll("tbody tr"))
			var dt = d3.select(".datatable-main").selectAll("tbody tr").data()		
			deleteList = dt.filter(function(t){ return t.__selected__; })//d3.selectAll(".datatable-selected > .datatable-check").data();
			
			if (deleteList.length > 0){
				
				d3.select("#delete")
				.data([true])
				.attr("class","btn btn-small tip")
				.attr("title", "Delete ( " + deleteList.length + " ) documents")
				
			}else{
				d3.select("#delete")
				.data([false])
				.attr("class","btn btn-small disabled")
				.attr("title", "")
			}

	})

	//load more
	
	d3.select("#docs").append("button")
	.attr("id", "loadMore")
	.attr("type", "button")
	.attr("data-loading-text", "Loading...")
	.attr('disabled', function(){if(total > nextOffset){$('#loadMore').removeAttr('disabled')}else{return "disabled"}})
	.attr("class", function(){if(total > nextOffset){return "btn btn-primary"}else{return "btn disabled"}})
	.text("Load More...")
	.on("click", function(){
		console.log(args);
		query.getCorpora(function(response){

			nextLimit = response.meta.next.limit;
			nextOffset = response.meta.next.offset;
			total = response.meta.total_count;
			var data = response.objects; 
			var oldData = dataTable.data();
			args['limit'] = nextLimit;
			args['offset'] = nextOffset;
			dataTable.data(oldData.concat(d3.values(data))).update();

			d3.select("#loadMore")
			.attr("class", function(){if(total > nextOffset){return "btn btn-primary"}else{return "btn disabled"}})
			.attr('disabled', function(){if(total > nextOffset){$('#loadMore').removeAttr('disabled') }else{return "disabled"}})

		},args);
	});

});

function switchCorpus(id){
	query.switchCorpus(id, function(response){
		$.removeCookie('sven_filters', { path: '/' });
		window.location.reload()
		});
};


$('#export') .click(function () {
	var btn = $(this);
	btn.button('loading');
	query.exportEntities(args['corpus'], function(response){
		window.location = response;
		btn.button('reset');
	});

})


$('#delete').click(function(){

	if (!deleteList.length)
		return;

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
		return i+1 + ". " + d.name;
	})

	d3.select("#deleteAlert .modal-message").text("These corpora will be permanently deleted and cannot be recovered. Are you sure?")
	d3.select("#deleteAlert .modal-header h3").text("Delete corpora?")

	d3.select("#deleteAlert .modal-upload")
	.style("display","inline")
	.on("click",function(){
		var btn = $(this);


		for ( i in deleteList){
			btn.button('loading');
			var id = deleteList[i].id
			query.deleteCorpus(id, function(response){

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

	 $('#deleteAlert').on('hidden',function(){
			
			if (!deletedFile.length)
				return;
			window.location.reload()
			
		})

})

