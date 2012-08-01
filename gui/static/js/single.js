
var query = new svenjs.Sven("http://127.0.0.1:8000"); 


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
    			
    			d3.select(".rel_doc").append("div")
					.attr("class","clear")
					
    			for (i in relations) {

    				query.getDocument(relations[i].target, function(response){
							relations[i]['relation target'] = response.results[0].title;
							var relation = d3.select(".rel_doc")
								.insert("div", ":first-child")
								.attr("class", "relation");

							relation.append("div")
								.attr("class","relation_target")
								.text(relations[i]['relation target']);
							
							relation.append("div")
								.attr("class","relation_type")
								.text(relations[i]['polarity']);
								
							});
					
    				
					
    				}
    		
// 				var relation = d3.select(".rel_doc").selectAll("div.relation")
// 					.data(relations)
// 					.enter().append("div")
// 						.attr("class", "relation")
// 				
// 				relation.append("div")
// 					.attr("class","relation_target")
// 					.text(function(d){
// 						query.getDocument(d.target, function(response){
// 							console.log(this, response.results[0].title)
// 							 //response.results[0].title;
// 							});
// 						});
// 				
// 				relation.append("div")
// 					.attr("class","relation_type")
// 					.text(function(d){ return d.polarity; })
// 
// 				
// 				d3.select(".rel_doc").append("div")
// 					.attr("class","clear")
			}
    		
    		},{filters:'{"source":' + id_document + '}'});
    	}
		
	},args);


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
				log( ui.item ?
					"Selected id: " + ui.item.id :
					"Nothing selected, input was " + this.value);
			},
			open: function() {
				$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
			},
			close: function() {
				$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
			}
		});
	
		$(".relations .btn").click(function(){
			relationArgs.source = id_document;
			relationArgs.polarity = $("#radio :radio:checked").val();
			relationArgs.description = $("#description").val();
			console.log(relationArgs);
			query.addRelation(function(response){
				
				$(".addResult").text(response.status);
				var status = response.status;
				if (status == 'ok'){
					var relation = d3.select(".rel_doc")
								.insert("div", ":first-child")
								.attr("class", "relation");

							relation.append("div")
								.attr("class","relation_target")
								.text(targetTitle);
							
							relation.append("div")
								.attr("class","relation_type")
								.text(relationArgs.polarity);
					
					}
				
				},relationArgs)
			});