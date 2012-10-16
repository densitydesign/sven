
var query = new svenjs.Sven(""); 

//add source document
query.getDocument(id_document, function(response){

    var data = response,
		status = data.status
    
	if (status == 'ko'){
    	d3.select("#source_document").text(data.error + ", error: " + data.errorCode);
		return
    }
    
	var text = response.text;
	var date = response.results[0].date.split('T')[0];
	var title = response.results[0].title;
	var actors = response.results[0].actors;
	var actorList = '';
	for (actor in actors) {
		actorList = actorList + actors[actor].name + " ";
		}
	d3.select(".actor").text(actorList);
	var tags = response.results[0].tags;
	//d3.select(".text").text(text);
	d3.select(".title h3").text(title);
	d3.select(".date").text(date);
    	
		
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
	document.getElementById('iframe1').src = "../../../gui/viewer/?id=" + pdfURL_source;
});

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
    
    	var text = response.text;
    	var date = response.results[0].date.split('T')[0];
    	var title = response.results[0].title;
    	var actors = response.results[0].actors;
    	var actorList = '';
    	for (actor in actors) {
    		actorList = actorList + actors[actor].name + " ";
    		}
    	targetDocument.select(".actor").text(actorList);
    	var tags = response.results[0].tags;
    	//d3.select(".text").text(text);
    	targetDocument.select(".title h3").text(title);
    	targetDocument.select(".date").text(date);
    	
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
   		document.getElementById('iframe2').src = "../../../gui/viewer/?id=" + pdfUrl_target;
	
	},args);
};
	
	

	var relationArgs = {}
	var targetTitle;
	
	var labels,mapped;
	
	$('#search-document').typeahead({
		source: function(q,process){
			query.getDocuments(function(data){
				labels = []
				mapped = {}
				data.results.forEach(function(item,i){
					mapped[item.title] = item.id
					labels.push(item.title)
				})
				process(labels);
			});
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
				console.log("andata bene cazzo")
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