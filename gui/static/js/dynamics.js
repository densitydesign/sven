var query = new svenjs.Sven("");


//query.getCorpora(function(response){
	
	

	query.graph(args['corpus'],function(response){
	
		if (response.status == "ko") return;
	
		var data = response,
			nodes = d3.entries(data.nodes).map(function(d){ return d.value; }),
			edges = d3.entries(data.edges).map(function(d){ return d.value; })
		
		console.log(data)
		
		var graph = sven.viz.graph()
			.target("#graph")
			.id(function(d){ return d.id ? d.id : d; })
			.label(function(d){ return d.name ? d.name : d; })
			.init();
	
		// nodes
		nodes.forEach(function(d){
			graph.addNode(d)
		})
	
		// edges
		
		var min = d3.min(edges.map(function(d){ return d.value })),
			max = d3.max(edges.map(function(d){ return d.value })),
			weight = d3.scale.linear().domain([min,max]).range([1,10])
	
		edges.forEach(function(d){
			graph.addEdge(d.source,d.target,{ weight : weight(d.value), size: weight(d.value) })
		})

	});


	query.streamgraph(args['corpus'],function(response){
	
		console.log(response);
	
	});

//})