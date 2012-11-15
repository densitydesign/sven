var sActor,
	tActor;
var query = new svenjs.Sven(""),
	sDocumentId,
	tDocumentId

//add source document
query.getDocument(id_document, function(response){

	console.log(response);
    var data = response,
		status = data.status
    
	if (status == 'ko'){
    	d3.select("#source_document").text(data.error + ", error: " + data.errorCode);
		return
    }
	
	sDocumentId = data.results[0].id;
    
	var mime = response.results[0].mime_type,	
		date = response.results[0].date.split('T')[0],
		title = response.results[0].title,
		actors = response.results[0].actors,
		tags = response.results[0].tags,
		actorList = '';
	
	sActor = actors;
		
	for (actor in actors) {
		actorList = actorList + actors[actor].name + " ";
	}
	
	d3.select(".doc-date").text(date);
	d3.select(".doc-title").text(title);
	d3.select(".doc-actor").text(actorList);
    	
		
	/* Tags */
	var tag = d3.select("#source_document")
		.select(".tags")
		.selectAll("span.badge")
		.data(tags)
		.enter().append("span")
			.attr("class", "tag badge badge-info")
			.text(function(d){return d.name;})
			console.log(pdfURL_source)
	//pdfViewer(pdfURL_source, 'source', 'pdf-container');
	
	var text = response.text
	if (mime == 'application/pdf'){
	var p_text = d3.select("#source_document .pdf-container p");
	if (p_text){
		p_text.remove();
		}
		$('#iframe1').show();
	document.getElementById('iframe1').src = "../../../gui/viewer/?id=" + pdfURL_source;
	}
	else{
		$('#iframe1').hide();
		d3.select("#source_document .pdf-container").append("p").text(text);
		}
},{'with-text':'true'});

$('#select-relations a:first').tab('show');
$('a[data-toggle="tab"]').on('show', function (e) {
	d3.select(".addResult")
	.style("display","none")
})

/* Relations */
 query.getRelations(function(response){

    		var relations = response.results;
    		if (relations){
    			
    			var relation = d3.select(".rel_doc").selectAll('div.relation')
    				.data(relations)
    				.enter()
    				.append('div')
    				.attr("class", "relation well")
    				
    				relation.append("div")
 						.attr("class","relation_target")
 						.text(function(d){ var testo = this;
    						query.getDocument(d.target, function(response){
    								d.relation_target = response.results[0].title
    								d3.select(testo).html('<div class="btn-link">' + d.relation_target + '</div>').on("click", function(){
    									pdfUrl_target = '../../../anta/api/documents/download/' + d.target;
    									addTargetDocument(d.target);
    									});
    							})
    						});
						
					
					
    		 		relation.append("div")
 						.attr("class","relation_type")
 						.text(function(d){return d.polarity});
 					
 					relation.append("button")
 						.attr("class","btn btn-small btn-danger")
						.text('delete')
						.on('click', function(d){$("#dialog-confirm").dialog('open'); 
							$("#dialog-confirm").dialog("option", "buttons", { 
									"Continue": function() { 
										$(this).dialog("close"); 
										console.log('la relazione: '+d.id +' sparirà');
										deleteRelation(d.id);
									},
									Cancel: function() {
										$( this ).dialog( "close" );
									} 
								})
							})
							
					relation.append("button")
 						.attr("class","btn btn-small btn-warning")
						.text('modify')
						.on('click', function(d,i){
							var modClass = ".modCont_" + i;
							$(modClass).toggle();
							});
					
					var modCont = relation.append("div")
						.attr("class",function(d,i){return "modCont_" + i})
						.attr("style","display:none");


					
					var relValue = [{"value":"PPO", "text":"Very Positive"}, {"value":"POS","text":"Positive"}, {"value":"NEU", "text":"Neutral"}, {"value":"NEG","text":"Negative"}, {"value":"NNE","text":"Very Negative"}];
					
					modCont.append("label")
						.text("Type of relation")
							
					modCont.append("div")
								.attr("class", "radioType btn-group")
								.attr("data-toggle", "buttons-radio")
									.selectAll("button")
									.data(relValue)
									.enter()
									.append("button")
									.attr("class", function(k){var polarity = d3.select(this.parentNode).data()[0].polarity; if(polarity == k.value){return "btn  btn-small active";}else{return "btn  btn-small";}})
									.attr("value", function(k){return k.value})
									.text(function(k){return k.text})

					
					
					modCont.append("label")
						.text("Description")
					
					modCont.append("textarea")
							.attr("maxlength","50")
							.attr("class","description")
							.text(function(d){return d.description})
					
					modCont.append("div")
						.attr("class","clear")
					
					modCont.append("div")
						.attr("id","addRelation")
						.attr("class","btn btn-info")
						.text("update relation")
						.on("click", function(d){
							var polarity = d3.select(this.parentNode).select(".radioType").select(".active").attr("value");
							var pClass = "."+$(this).parent().attr("class");
							var description = $(pClass + " .description" ).val();
							var args = {"polarity":polarity, "source": d.source, "target":d.target, "description":description}; 
							console.log(args, d.id);
							updateRalation(d.id, args)
							});



							
    			d3.select(".rel_doc").append("div")
					.attr("class","clear")
			
				//pdfViewer(pdfURL_source, 'source', 'pdf-container');
			}
    		
},{filters:'{"source":' + id_document + '}'});
    	
		/* 
		}
		
	},args);


	*/


	
//add target document

function addTargetDocument(id_document){
query.getDocument(id_document, function(response){
	console.log(response)
	var targetDocument = d3.select("#target_document");
    var data = response; 
    var status = data.status
    
	if (status == 'ko'){
    	target_document.text(data.error + ", error: " + data.errorCode);
    	return;
	}
    
	tDocumentId = data.results[0].id;
	
    	var text = response.text;
    	var date = response.results[0].date.split('T')[0];
    	var title = response.results[0].title;
    	var actors = response.results[0].actors;
    	var actorList = '';
    	var tags = response.results[0].tags;
    	var mime = response.results[0].mime_type;
		
		tActor = actors;
		
		for (actor in actors) {
    		actorList = actorList + actors[actor].name + " ";
    		}
		
		targetDocument.select(".doc-date").text(date);
		targetDocument.select(".doc-title").text(title);
		targetDocument.select(".doc-actor").text(actorList);
    	
		/* Tags */
		
		$("#target_document .tags").empty();
		
		var tag = targetDocument
			.select(".tags")
			.selectAll("span.badge")
			.data(tags)
			.enter().append("span")
				.attr("class", "tag badge badge-info")
				.text(function(d){return d.name;})
		
    	
		//pdfViewer(pdfUrl_target, 'target', 'pdf-container');
		$("#target_document").css({visibility:"visible"});
		$("#target_document .text").width($("#target_document").width());
   		$("#target_document .text").height(600);
   		
   		if (mime == 'application/pdf'){
   		var p_text = d3.select("#target_document .pdf-container p");
	if (p_text){
		p_text.remove();
		}
		$('#iframe2').show();
	document.getElementById('iframe2').src = "../../../gui/viewer/?id=" + pdfUrl_target;
	}
	else{
		$('#iframe2').hide();
		d3.select("#target_document .pdf-container").append("p").text(text);
		}

	
	},{'with-text':'true'});
};
	
	

	var relationArgs = {}
	var targetTitle;
	
	var labels,mapped;
	
	$('#search-document').typeahead({
		source: function(q,process){
			query.getDocuments(function(data){
				labels = []
				mapped = {}
				data.objects.forEach(function(item,i){
					mapped[item.title] = item.id
					labels.push(item.title)
				})
				process(labels);
			},args);
		},
		updater : function(item) {
			
			console.log("ci sono")
			relationArgs.target = mapped[item];
			targetTitle = item;
			pdfUrl_target = '../../../anta/api/documents/download/' + mapped[item]; // BAD!!!!!!
			addTargetDocument(mapped[item]);
			return item;
		}
		
		
	})
	
	
	/*
	$( "#search" ).autocomplete({
			source: function( request, response ) {
				
				query.getDocuments(function(data){
					response( $.map( data.results, function( item ) {
							return {
								label: item.title,
								value: item.title,
								id: item.id
							}
						}));
					}, {filters:'{"title__istartswith":"' + request.term + '"}'});
			},
			minLength: 3,
			select: function( event, ui ) {
				relationArgs.target = ui.item.id;
				targetTitle = ui.item.label;
				pdfUrl_target = 'http://127.0.0.1:8000/anta/api/documents/download/' + ui.item.id;
				addTargetDocument(ui.item.id);

			},
			open: function() {
				$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
			},
			close: function() {
				$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
			}
		});
		*/
		$(".relations #addRelation").click(function(){
			relationArgs.source = id_document;
			relationArgs.polarity = d3.select("#radio").select(".active").attr("value");
			console.log(relationArgs.polarity)
			relationArgs.description = $("#description").val();
			
			query.addRelation(function(response){
				
				var status = response.status;
				if (status != 'ok'){
					
					d3.select(".addResult")
						.style("display","block")
						.attr("class","addResult alert alert-error")
						.html(function(d){
							var errorString = d3.values(response.error).join("<br/>")
							return "<strong>Oh. Something went wrong:</strong><p>"+errorString+"</p>"
						})
					
					return;
				}
				
				d3.select(".addResult")
					.style("display","block")
					.attr("class","addResult alert alert-success")
					.html(function(d){
						return "<strong>Great! </strong><p>The relation has been successfully created.</p>"
					})
				
				drawRelation();
					
				},relationArgs)
			});
			
	$( "#dialog-confirm" ).dialog({
			resizable: false,
			height:175,
			autoOpen:false,
			modal: true
			
		});

function deleteRelation(id){

	query.deleteRelation(id, function(response){
		if (response.status == 'ok'){
		
			drawRelation();
			
			}
		});
	}
	
function drawRelation(){
	
			query.getRelations(function(response){

    		var relations = response.results;
    		d3.select(".rel_doc").selectAll('div.relation').remove();
    		if (relations){
    			
    			var relation = d3.select(".rel_doc").selectAll('div.relation')
    				.data(relations)
    				.enter()
    				.append('div')
    				.attr("class", "relation well")
    				
    				relation.append("div")
 						.attr("class","relation_target")
 						.text(function(d){ var testo = this;
    						query.getDocument(d.target, function(response){
    								d.relation_target = response.results[0].title
    								d3.select(testo).html('<div class="btn-link">' + d.relation_target + '</div>').on("click", function(){
    									pdfUrl_target = '../../../anta/api/documents/download/' + d.target;
    									addTargetDocument(d.target);
    									});
    							})
    						});
						

    		 		relation.append("div")
 						.attr("class","relation_type")
 						.text(function(d){return d.polarity});
 							
 					relation.append("div")
 						.attr("class","btn btn-danger btn-small")
						.text('delete')
						.on('click', function(d){$("#dialog-confirm").dialog('open'); 
							$("#dialog-confirm").dialog("option", "buttons", { 
									"Continue": function() { 
										$(this).dialog("close"); 
										console.log('la relazione: '+d.id +' sparirà');
										deleteRelation(d.id);
									},
									Cancel: function() {
										$( this ).dialog( "close" );
									} 
								})
							});
							
							
    			relation.append("button")
 						.attr("class","btn btn-small btn-warning")
						.text('modify')
						.on('click', function(d,i){
							var modClass = ".modCont_" + i;
							$(modClass).toggle();
							});
					
					var modCont = relation.append("div")
						.attr("class",function(d,i){return "modCont_" + i})
						.attr("style","display:none");


					
					var relValue = [{"value":"PPO", "text":"Very Positive"}, {"value":"POS","text":"Positive"}, {"value":"NEU", "text":"Neutral"}, {"value":"NEG","text":"Negative"}, {"value":"NNE","text":"Very Negative"}];
					
					modCont.append("label")
						.text("Type of relation")
							
					modCont.append("div")
								.attr("class", "radioType btn-group")
								.attr("data-toggle", "buttons-radio")
									.selectAll("button")
									.data(relValue)
									.enter()
									.append("button")
									.attr("class", function(k){var polarity = d3.select(this.parentNode).data()[0].polarity; if(polarity == k.value){return "btn  btn-small active";}else{return "btn  btn-small";}})
									.attr("value", function(k){return k.value})
									.text(function(k){return k.text})

					
					
					modCont.append("label")
						.text("Description")
					
					modCont.append("textarea")
							.attr("maxlength","50")
							.attr("class","description")
							.text(function(d){return d.description})
					
					modCont.append("div")
						.attr("class","clear")
					
					modCont.append("div")
						.attr("id","addRelation")
						.attr("class","btn btn-info")
						.text("update relation")
						.on("click", function(d){
							var polarity = d3.select(this.parentNode).select(".radioType").select(".active").attr("value");
							var pClass = "."+$(this).parent().attr("class");
							var description = $(pClass + " .description" ).val();
							var args = {"polarity":polarity, "source": d.source, "target":d.target, "description":description}; 
							console.log(args, d.id);
							updateRalation(d.id, args)
							});



							
    			d3.select(".rel_doc").append("div")
					.attr("class","clear")
			
			}
    		
    		},{filters:'{"source":' + id_document + '}'});
	
	}
	
function updateRalation(id, args){
	
			query.updateRelation(id, function(response){
				
				var status = response.status;
				if (status != 'ok'){
					$(".updateResult").empty();
					d3.select(".updateResult")
						.append("div")
						.style("display","block")
						.attr("class","alert alert-error")
						.html(function(d){
							var errorString = d3.values(response.error).join("<br/>")
							return '<a class="close" data-dismiss="alert" href="#">&times;</a><strong>Oh. Something went wrong:</strong><p>'+errorString+'</p>'
						})
					
					return;
				}
				console.log("andata bene cazzo")
				$(".updateResult").empty();
				d3.select(".updateResult")
					.append("div")
					.style("display","block")
					.attr("class","alert alert-success")
					.html(function(d){
						return '<a class="close" data-dismiss="alert" href="#">&times;</a><strong>Great! </strong><p>The relation has been successfully updated.</p>'
					})
				
				drawRelation();
					
				},args)

}
// ref_date, title
var documentId,
	trigger,
	key;

$('#editing').on('show', function (e, a) {

	trigger = d3.select(d3.event.target).attr("class");
	value = d3.select(d3.event.target).text();
	var actorDoc;
	
	if (trigger.search("doc-source") != -1){
		documentId = sDocumentId;
		actorDoc = sActor;
		}
	else {documentId = tDocumentId;
			actorDoc = tActor;
	};
		
	
	if (trigger.search("doc-title") != -1) {
		
		d3.select("#editing .modal-body label").text("Please provide a new value:");
		key = "title";
		d3.select("#editing-input").property("value",value);
		return;
	}
	
	if (trigger.search("doc-date") != -1) {
	
		d3.select("#editing .modal-body label").text("Please provide a new value:");
		key = "ref_date";
		d3.select("#editing-input").property("value",value);
		return;
	}
	
	if (trigger.search("doc-actor") != -1) {
		
		d3.select("#editing-input").property("value","");
		
		d3.select("#editing .modal-body label").text("Enter new actors (eg: actor1,actor2)")
		
		d3.select("#editing .modal-body").append("div")
			.attr("class", "btn-toolbar")
			.selectAll("div")
			.data(actorDoc)
			.enter()
			.append("div")
			.attr("class", "btn-group")
			.append("button")
			.attr("class","btn btn-small btn-info")
			.text(function(d){console.log(d); return d.name + " "})
			.on("click", function(d){
					
					$(this).hide();
					query.detachTag(documentId, d.id,function(response){
						
						console.log(response);
						});
					
					})
			.append("i")
			.attr("class","icon-remove-sign icon-white")

  
		console.log("actor", value)
		return;
	}
	
})


d3.selectAll(".editable")
	.on("click",function(d){	
		$("#editing").modal("show")		
	})

d3.select("#editing-save")
	.on("click",function(d){
	
		if (trigger.search("doc-actor") != -1) {
			var args = {};
			args['type'] = 'actor';
			var nameList = d3.select("#editing-input").property("value").split(",");
			if(nameList){
			nameList.forEach(function(item,i){
			args['name'] = item;
			query.addTag(documentId, function(response){
				
				console.log(response);
				$("#editing").modal("hide");
			window.location.reload();
				
				},args);
				});
			}else{return;}
		}
		else{
		var args = {};
		args[key] = d3.select("#editing-input").property("value");
		

		query.updateDocument(documentId, function(response){
			
			console.log(response);
			
			$("#editing").modal("hide");
			window.location.reload();
			
		}, args)
		}
		
})