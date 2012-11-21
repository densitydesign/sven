var query = new svenjs.Sven("");  
var show = true;
var timeline;
var relArgs = {};

relArgs['corpus'] = args['corpus'];

	query.getActors(function(response){
		console.log(response);
		var actorList = response.objects;
		d3.select(".filterActors").selectAll("label.checkbox")
		.data(actorList)
		.enter()
		.append("label")
		.attr("class", "checkbox")
		.text(function(d){return d.name;})
		.append("input")
		.attr("type", "checkbox")
		
		
		});

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
		
	
	function setFilters(){
	//args['limit'] = 0;
	//args['offset'] = 50;
	var filters = {};
	filters["language__in"] = []
	d3.select(".filterLang").selectAll("input:checked").each(function(d){filters["language__in"].push(d.key)});
	if (filters["language__in"].length == 0){delete filters["language__in"]}
	filters["tags__id__in"] = [];
	d3.select(".filterActors").selectAll("input:checked").each(function(d){filters["tags__id__in"].push(d.id)});
	if (filters["tags__id__in"].length == 0){delete filters["tags__id__in"]}
	args['filters'] = JSON.stringify(filters);
	updateTimeline();
	}
	

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

		
	var docIdList = d3.nest()
    .key(function(d) { return d.id; })
    .entries(data)
    .map(function(d){return d.key});
    
	var relFilters = {};
	relFilters["source__in"] = docIdList;
	relArgs["filters"] = JSON.stringify(relFilters);
	
	//TODO: check for limits and offset: we need ALL the relations here!
	query.getRelations(function(response){
		console.log(response);
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
	
},args);
	
	}