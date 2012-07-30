
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
    		
    			for (i in relations) {

    				query.getDocument(relations[i].target, function(response){
							relations[i]['relation target'] = response.results[0].title;
							var relation = d3.select(".rel_doc")
								.append("div")
								.attr("class", "relation");

							relation.append("div")
								.attr("class","relation_target")
								.text(relations[i]['relation target']);
							
							relation.append("div")
								.attr("class","relation_type")
								.text(relations[i]['polarity']);
								
							});
					
    				d3.select(".rel_doc").append("div")
					.attr("class","clear")
					
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


//$('.relations .btn').click(function(){
	
	$( "#search" ).autocomplete({
			source: function( request, response ) {
				$.ajax({
					url: "http://ws.geonames.org/searchJSON",
					dataType: "jsonp",
					data: {
						featureClass: "P",
						style: "full",
						maxRows: 12,
						name_startsWith: request.term
					},
					success: function( data ) {
						response( $.map( data.geonames, function( item ) {
							return {
								label: item.name + (item.adminName1 ? ", " + item.adminName1 : "") + ", " + item.countryName,
								value: item.name
							}
						}));
					}
				});
			},
			minLength: 2,
			select: function( event, ui ) {
				log( ui.item ?
					"Selected: " + ui.item.label :
					"Nothing selected, input was " + this.value);
			},
			open: function() {
				$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
			},
			close: function() {
				$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
			}
		});

//		});
		
