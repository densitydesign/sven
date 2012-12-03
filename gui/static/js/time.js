var query = new svenjs.Sven("");  
var show = true;
var timeline;
var relArgs = {};
var prevFilters = $.cookie('sven_filters');
var nextLimit;
var nextOffset;
var total;

relArgs['corpus'] = args['corpus'];

query.getActors(function(response){
		
		var actorList = response.objects;
		/*
		d3.select(".filterActors").selectAll("label.checkbox")
		.data(actorList)
		.enter()
		.append("label")
		.attr("class", "checkbox")
		.text(function(d){return d.name;})
		.append("input")
		.attr("type", "checkbox")
		*/
		d3.select(".filterActorsSelect").append("select").attr("multiple", "multiple").attr("id","selectActors").selectAll("option")
		.data(actorList)
		.enter()
		.append("option")
		.attr("value", function(d){return d.id;})
		.text(function(d){return d.name;})
		
		$("#selectActors").select2({
                placeholder: "Select actors",
                allowClear: true,
                width:"element",
                closeOnSelect:false
            });
		
		
		},actorArgs);

query.getDocuments(function(response){

	var data = response.objects;
	var format = d3.time.format("%Y-%m-%dT%H:%M:%S");

		
	var nodes = d3.values(data)
	nodes.forEach(function(d){
		d.date = format.parse(d.date);
		d.id_document = d.id;
		d.actor = '';
		for (var i in d.actors)
			d.actor = d.actor + d.actors[i].name + ' ';
	})

	nodes = nodes.sort(function(a,b){
		return a.date > b.date ? 1 : a.date == b.date ? 0 : -1;
	})
	
	var langList = d3.nest()
    .key(function(d) { return d.language; })
    .entries(data);
	
	var docIdList = d3.nest()
    .key(function(d) { return d.id; })
    .entries(data)
    .map(function(d){return d.key});
    
	var relFilters = {};
	relFilters["source__in"] = docIdList;
	relFilters["target__in"] = docIdList;
	relArgs["filters"] = JSON.stringify(relFilters);
    
    d3.select(".filterLang").selectAll("label.checkbox")
		.data(langList)
		.enter()
		.append("label")
		.attr("class", "checkbox")
		.text(function(d){return d.key;})
		.append("input")
		.attr("type", "checkbox")
		
	//apply filters
	d3.select("#filters").append("button")
		.attr("class", "btn btn-small btn-success")
		.text("Apply filters")
		.on("click", function(){setFilters();})
	
	//load more doc
	
	nextLimit = response.meta.next.limit;
	nextOffset = response.meta.next.offset;
	total = response.meta.total_count;
	args['limit'] = nextLimit;
	args['offset'] = nextOffset;
	

		
	d3.select("#timeInfo").insert("button", "toogle-button")
	 .attr("id", "loadMore")
	 .attr("type", "button")
	 .attr("data-loading-text", "Loading...")
	 .attr('disabled', function(){if(total > nextOffset){$('#loadMore').removeAttr('disabled')}else{return "disabled"}})
	 .attr("class", function(){if(total > nextOffset){return "btn btn-mini btn-primary"}else{return "btn btn-mini disabled"}})
	 .text("Load More...")
	 .on("click", function(){
	 		console.log(args);
	 		query.getDocuments(function(response){
		
		nextLimit = response.meta.next.limit;
		nextOffset = response.meta.next.offset;
		total = response.meta.total_count;
	    var data = response.objects; 
	    
	    	var nodes = d3.values(data)
	nodes.forEach(function(d){
		d.date = format.parse(d.date);
		d.id_document = d.id;
		d.actor = '';
		for (var i in d.actors)
			d.actor = d.actor + d.actors[i].name + ' ';
	})
		    
		var oldData = timeline.nodes();
		
		nodes = oldData.concat(nodes);
		
		d3.select("#timeInfo span")
		.text(" " + nodes.length + "/" + total + " documents are displayed  ")
		
			nodes = nodes.sort(function(a,b){
		return a.date > b.date ? 1 : a.date == b.date ? 0 : -1;
	})
		
		args['limit'] = nextLimit;
		args['offset'] = nextOffset;
		
		var newDocIdList = d3.nest()
    .key(function(d) { return d.id; })
    .entries(data)
    .map(function(d){return d.key});
    
    docIdList = docIdList.concat(newDocIdList)
    
	var relFilters = {};
	relFilters["source__in"] = docIdList;
	relFilters["target__in"] = docIdList;
	relArgs["filters"] = JSON.stringify(relFilters);
	
	//TODO: check for limits and offset: we need ALL the relations here!
	query.getRelations(function(response){
		
		var links = response.results;
		if (!links) return;
		
		$("#blocks").empty();
		$("#stack").empty()
		
		timeline = sven.viz.timeline()
			.nodes(nodes)
			.links(links)
			.target("#timeline")
			.update()
				
	},relArgs);
		
		
		d3.select("#loadMore")
			 .attr("class", function(){if(total > nextOffset){return "btn btn-mini btn-primary"}else{return "btn btn-mini disabled"}})
			 .attr('disabled', function(){if(total > nextOffset){$('#loadMore').removeAttr('disabled') }else{return "disabled"}})
		
		},args);
	 		
	 	});
	 	
	 	
		d3.select("#timeInfo").insert("span", "toogle-button")
		.text(" " + data.length + "/" + total + " documents are displayed  ")	
	//TODO: check for limits and offset: we need ALL the relations here!
	query.getRelations(function(response){

		var links = response.results;
		if (!links) return;

		timeline = sven.viz.timeline()
			.nodes(nodes)
			.links(links)
			.target("#timeline")
			.update()
				
	},relArgs);
	
},args);


d3.select("#toggle-button").on("click", function(){
	show = !show;
	var olds = timeline.links();
	olds.forEach(function(l){
		l.path.visible = show;
	})
	
	d3.select("#toggle-icon")
		.attr("class", function(d){
			return !show ? "icon-eye-open" : "icon-eye-close"
	})	
	timeline.update();
	
});


function setFilters(){
	args['limit'] = 50;
	args['offset'] = 0;
	var filters = {};
	filters["language__in"] = []
	d3.select(".filterLang").selectAll("input:checked").each(function(d){filters["language__in"].push(d.key)});
	if (filters["language__in"].length == 0){delete filters["language__in"]}
	filters["tags__id__in"] = $("#selectActors").select2("val");
	//d3.select(".filterActors").selectAll("input:checked").each(function(d){filters["tags__id__in"].push(d.id)});
	if (filters["tags__id__in"].length == 0){delete filters["tags__id__in"]}
	args['filters'] = JSON.stringify(filters);
	updateTimeline();
	}
	
function updateTimeline(){
	
	query.getDocuments(function(response){

	var data = response.objects;
	var format = d3.time.format("%Y-%m-%dT%H:%M:%S");

		
	var nodes = d3.values(data)
	nodes.forEach(function(d){
		d.date = format.parse(d.date);
		d.id_document = d.id;
		d.actor = '';
		for (var i in d.actors)
			d.actor = d.actor + d.actors[i].name + ' ';
	})

	nodes = nodes.sort(function(a,b){
		return a.date > b.date ? 1 : a.date == b.date ? 0 : -1;
	})

	nextLimit = response.meta.next.limit;
	nextOffset = response.meta.next.offset;
	total = response.meta.total_count;
	args['limit'] = nextLimit;
	args['offset'] = nextOffset;
	
	var docIdList = d3.nest()
    .key(function(d) { return d.id; })
    .entries(data)
    .map(function(d){return d.key});
    
	var relFilters = {};
	relFilters["source__in"] = docIdList;
	relFilters["target__in"] = docIdList;
	relArgs["filters"] = JSON.stringify(relFilters);
	
	
	//TODO: check for limits and offset: we need ALL the relations here!
	query.getRelations(function(response){
		
		var links = response.results;
		if (!links) return;
		
		$("#blocks").empty();
		$("#stack").empty()
		
		timeline = sven.viz.timeline()
			.nodes(nodes)
			.links(links)
			.target("#timeline")
			.update()
			
			d3.select("#loadMore")
			.attr("class", function(){if(total > nextOffset){return "btn btn-mini btn-primary"}else{return "btn btn-mini disabled"}})
			.attr('disabled', function(){if(total > nextOffset){$('#loadMore').removeAttr('disabled') }else{return "disabled"}})
			
			d3.select("#timeInfo span").text(" " + data.length + "/" + total + " documents are displayed  ")
				
	},relArgs);
	
},args);
	
	}