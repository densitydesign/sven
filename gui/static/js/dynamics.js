var query = new svenjs.Sven("");
var graph;

//bug fixing..to be removed
var scale = d3.scale.ordinal().domain([ "#D7191C","#FDAE61","#FFFFBF","#A6D96A","#1A9641" ]).range(["#1A9641", "#A6D96A", "#FFFFBF", "#FDAE61", "#D7191C"]);
var change = function(c){if(c == "#ffffff"){return "rgba(204,204,204,0.3)"}else{return scale(c)}}

// get actors
	
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
                width:function(){return $("#filters").width() + "px"},
                closeOnSelect:false
            });
		
		},actorArgs);

query.getDocuments(function(response){

		//nextLimit = response.meta.next.limit;
		//nextOffset = response.meta.next.offset;
		//total = response.meta.total_count;
		//args['limit'] = nextLimit;
		//args['offset'] = nextOffset;
	    var data = response.objects; 

	

	 
		
	var langList = d3.nest()
    .key(function(d) { return d.language; })
    .entries(data);

    
    d3.select(".filterLang").selectAll("label.checkbox")
		.data(langList)
		.enter()
		.append("label")
		.attr("class", "checkbox")
		.text(function(d){return d.key;})
		.append("input")
		.attr("type", "checkbox")
	
	//datepicker
	$('#alert').hide();
	
	var dateList = d3.nest()
    .key(function(d) { return d.date; })
    .entries(data);
    
    //console.log(d3.min(dateList.map(function(d){return d.key})), d3.max(dateList.map(function(d){return d.key})));
	var minDate = d3.min(dateList.map(function(d){return d.key}));
	var maxDate = d3.max(dateList.map(function(d){return d.key}));
	

	if(dateList.length > 0){
	d3.select("#dp1").attr("data-date", minDate.split("T")[0]);
	d3.select("#dp2").attr("data-date", maxDate.split("T")[0]);
	d3.select("#startDate").text(minDate.split("T")[0]);
	d3.select("#endDate").text(maxDate.split("T")[0]);
	}
	//var startDate = new Date(2000,0,1);
	//var endDate = new Date(2012,1,25);
			$('#dp1').datepicker()
				.on('changeDate', function(ev){
					if (ev.date.valueOf() > endDate.valueOf()){
						$('#alert').show().find('strong').text('The start date can not be greater then the end date');
					} else {
						$('#alert').hide();
						startDate = new Date(ev.date);
						$('#startDate').text($('#dp1').data('date'));
					}
					$('#dp1').datepicker('hide');
				});
			$('#dp2').datepicker()
				.on('changeDate', function(ev){
					if (ev.date.valueOf() < startDate.valueOf()){
						$('#alert').show().find('strong').text('The end date can not be less then the start date');
					} else {
						$('#alert').hide();
						endDate = new Date(ev.date);
						$('#endDate').text($('#dp2').data('date'));
					}
					$('#dp2').datepicker('hide');
				});
	//end datepicker
	
	//apply filters
	d3.select("#filters").append("button")
		.attr("class", "btn btn-small btn-success")
		.text("Apply filters")
		.on("click", function(){setFilters();})
		
	d3.select("#filter").append("hr")
	
	function setFilters(){
	//args['limit'] = 0;
	//args['offset'] = 50;
	var filters = {};
	filters["ref_date__gte"] = $('#dp1').data('date') + " 00:00";
	filters["ref_date__lte"] = $('#dp2').data('date') + " 00:00";
	filters["language__in"] = []
	d3.select(".filterLang").selectAll("input:checked").each(function(d){filters["language__in"].push(d.key)});
	if (filters["language__in"].length == 0){delete filters["language__in"]}
	filters["tags__id__in"] = $("#selectActors").select2("val");
	//d3.select(".filterActors").selectAll("input:checked").each(function(d){filters["tags__id__in"].push(d.id)});
	if (filters["tags__id__in"].length == 0){delete filters["tags__id__in"]}
	args['filters'] = JSON.stringify(filters);
	updateGraph();
	}
	},args);
	
	

	query.graph(args['corpus'],function(response){
	
		if (response.status == "ko") return;
	
		var data = response,
			nodes = d3.entries(data.nodes).map(function(d){ return d.value; }),
			edges = d3.entries(data.edges).map(function(d){ return d.value; })
		
		
		
		var edgesL = data.edges;
		var valueList = d3.nest()
    .key(function(d) { return d.value; })
    .entries(edgesL);
    
	var minValue = d3.min(valueList.map(function(d){return d.key}));
	var maxValue = d3.max(valueList.map(function(d){return d.key}));
	
	var ascending = function(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
	valueList = valueList.map(function(d){return parseFloat(d.key)}).sort(ascending);
	
	$( "#slider-range-min" ).slider({
            range: "min",
            value: 1,
            min: 1,
            max: valueList.length,
            slide: function( event, ui ) {
                console.log(valueList[ui.value-1]);
                args['min-cosine-similarity'] = valueList[ui.value-1];
            }
        });

		
		graph = sven.viz.graph()
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
			graph.addEdge(d.source,d.target,{ weight : weight(d.value), size: weight(d.value), color: change(d.color) })
		})
		
		//zoom control
		$('#zoomIn').click(function(){graph.zoomIn()})
		$('#zoomOut').click(function(){graph.zoomOut()})
		$('#zoomCenter').click(function(){graph.center()})

	});


	query.streamgraph(args['corpus'],function(response){
	
		//console.log(response);
	
	});

function updateGraph(){
	
	query.graph(args['corpus'],function(response){
	
		$("#graph").empty();
		if (response.status == "ko") return;
	
		var data = response,
			nodes = d3.entries(data.nodes).map(function(d){ return d.value; }),
			edges = d3.entries(data.edges).map(function(d){ return d.value; })
		
		
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
			graph.addEdge(d.source,d.target,{ weight : weight(d.value), size: weight(d.value), color:change(d.color) })
		})
		
		//zoom control
		$('#zoomIn').click(function(){graph.zoomIn()})
		$('#zoomOut').click(function(){graph.zoomOut()})
		$('#zoomCenter').click(function(){graph.center()})

	},args);

	
	query.streamgraph(args['corpus'],function(response){
	
		//console.log(response);
	
	});

	
	}
