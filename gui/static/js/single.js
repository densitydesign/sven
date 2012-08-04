
var query = new svenjs.Sven("http://127.0.0.1:8000"); 

//add source document
query.getDocument(id_document, function(response){

    var data = response; 
    var status = data.status
    if (status == 'ko'){
    	d3.select("#source_document").text(data.error + ", error: " + data.errorCode);
    	}
    else {
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
    	
		var tag = d3.select(".tags").selectAll("div.tag")
				.data(tags)
				.enter().append("div")
					.attr("class", "tag")
		
			tag.append("div")
				.attr("class","arrow")
		
			var tag_cont = tag.append("div")
				.attr("class","tag_cont")
		
			tag_cont.append("div")
				.attr("class","tag_text")
				.text(function(d){ return d.name; })
		
			tag_cont.append("div")
				.attr("class","tag_number")
				.text("0")
		
			tag_cont.append("div")
				.attr("class","clear")
		
			tag.append("div")
				.attr("class","clear")
				
			d3.select(".tags").append("div")
				.attr("class","clear")
			
			//details.append("div")
			//	.attr("class","clear")
				
    	query.getRelations(function(response){

    		var relations = response.results;
    		if (relations){
    			
    			var relation = d3.select(".rel_doc").selectAll('div.relation')
    				.data(relations)
    				.enter()
    				.append('div')
    				.attr("class", "relation")
    				
    				relation.append("div")
 						.attr("class","relation_target")
 						.text(function(d){ var testo = this;
    						query.getDocument(d.target, function(response){
    								d.relation_target = response.results[0].title
    								d3.select(testo).text(d.relation_target);
    							})
    						});
						

    		 		relation.append("div")
 						.attr("class","relation_type")
 						.text(function(d){return d.polarity});
 							
 					relation.append("div")
 						.attr("class","btn")
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
							
							
    			d3.select(".rel_doc").append("div")
					.attr("class","clear")
			
				pdfViewer(pdfURL_source, 'source', 'container');
			}
    		
    		},{filters:'{"source":' + id_document + '}'});
    	}
		
	},args);


//add target document
function addTargetDocument(id_document){
query.getDocument(id_document, function(response){
	
	var targetDocument = d3.select("#target_document");
    var data = response; 
    var status = data.status
    if (status == 'ko'){
    	target_document.text(data.error + ", error: " + data.errorCode);
    	}
    else {
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
    	
		var tag = targetDocument.select(".tags").selectAll("div.tag")
				.data(tags)
				.enter().append("div")
					.attr("class", "tag")
		
			tag.append("div")
				.attr("class","arrow")
		
			var tag_cont = tag.append("div")
				.attr("class","tag_cont")
		
			tag_cont.append("div")
				.attr("class","tag_text")
				.text(function(d){ return d.name; })
		
			tag_cont.append("div")
				.attr("class","tag_number")
				.text("0")
		
			tag_cont.append("div")
				.attr("class","clear")
		
			tag.append("div")
				.attr("class","clear")
				
			targetDocument.select(".tags").append("div")
				.attr("class","clear")
			
			//details.append("div")
			//	.attr("class","clear")
				
//     	query.getRelations(function(response){
// 
//     		var relations = response.results;
//     		if (relations){
//     			
//     			targetDocument.select(".rel_doc").append("div")
// 					.attr("class","clear")
// 					
//     			for (i in relations) {
// 
//     				query.getDocument(relations[i].target, function(response){
// 							relations[i]['relation target'] = response.results[0].title;
// 							var relation = targetDocument.select(".rel_doc")
// 								.insert("div", ":first-child")
// 								.attr("class", "relation");
// 
// 							relation.append("div")
// 								.attr("class","relation_target")
// 								.text(relations[i]['relation target']);
// 							
// 							relation.append("div")
// 								.attr("class","relation_type")
// 								.text(relations[i]['polarity']);
// 								
// 							});
// 					
//     				
// 					
//     				}
// 				pdfViewer(pdfURL_target, 'target', 'container');
// 			}
//     		
//     		},{filters:'{"source":' + id_document + '}'});
    	}
		pdfViewer(pdfUrl_target, 'target', 'container');
		$("#target_document .text").width($("#target_document").width());
   		$("#target_document .text").height(600);
	},args);
}

//Add relations
	var relationArgs = {}
	var targetTitle;
	$( "#radio" ).buttonset();
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
	
		$(".relations #addRelation").click(function(){
			relationArgs.source = id_document;
			relationArgs.polarity = $("#radio :radio:checked").val();
			relationArgs.description = $("#description").val();
			query.addRelation(function(response){
				
				$(".addResult").text(response.status);
				var status = response.status;
				if (status == 'ok'){
// 					var relation = d3.select(".rel_doc")
// 								.insert("div", ":first-child")
// 								.attr("class", "relation");
// 
// 							relation.append("div")
// 								.attr("class","relation_target")
// 								.text(targetTitle);
// 							
// 							relation.append("div")
// 								.attr("class","relation_type")
// 								.text(relationArgs.polarity);
					drawRelation();
					
					}
				
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
    				.attr("class", "relation")
    				
    				relation.append("div")
 						.attr("class","relation_target")
 						.text(function(d){ var testo = this;
    						query.getDocument(d.target, function(response){
    								d.relation_target = response.results[0].title
    								d3.select(testo).text(d.relation_target);
    							})
    						});
						

    		 		relation.append("div")
 						.attr("class","relation_type")
 						.text(function(d){return d.polarity});
 							
 					relation.append("div")
 						.attr("class","btn")
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
							
							
    			d3.select(".rel_doc").append("div")
					.attr("class","clear")
			
			}
    		
    		},{filters:'{"source":' + id_document + '}'});
	
	}