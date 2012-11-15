var query = new svenjs.Sven("");  
var show = true;
var timeline;

query.getDocuments(function(response){

	var data = response.objects;
	var format = d3.time.format("%Y-%m-%dT%H:%M:%S");

		
	nodes = d3.values(data)
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
	
	//TODO: check for limits and offset: we need ALL the relations here!
	query.getRelations(function(response){

		var links = response.results;
		if (!links) return;

		timeline = sven.viz.timeline()
			.nodes(nodes)
			.links(links)
			.target("#timeline")
			.update()
				
	},args);
	
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
