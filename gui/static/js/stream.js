var query = new svenjs.Sven("");
var streamkey;

//bug fixing..to be removed
var scale = d3.scale.ordinal().domain([ "#D7191C","#FDAE61","#FFFFBF","#A6D96A","#1A9641" ]).range(["#1A9641", "#A6D96A", "#FFFFBF", "#FDAE61", "#D7191C"]);
var change = function(c){if(c == "#ffffff"){return "rgba(204,204,204,0.3)"}else{return c}}

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
	updateStream();
	}
	},args);
	
query.streamgraph(args['corpus'],function(response){
	
	var data = response.actors;
	
	var actors = d3.keys(data);
	
	
	var dataF = [];
	actors.forEach(function(d){
		
		data[d].forEach(function(k){k.actor = d; k.step = k.actor; k.value = k.tf*1000; dataF.push(k);});
	
		
		})
	
	
	dataF = d3.nest().key(function(d){return d.concept}).entries(dataF).sort(function(a,b){ return b.values.length - a.values.length}).filter(function(d){return d.values.length >= 2});

	actors.forEach(function(d){
		
		dataF.forEach(function(k){
			
			var p = d3.nest().key(function(c){return c.actor}).entries(k.values)
			p = p.map(function(l){return l.key})
			if($.inArray(d, p) < 0){
				k.values.push({'actor': d, 'step':d, 'value':0})
				}
			
			k.values.sort(function(a,b){ return a.actor > b.actor? 1 : -1;})
			
			})
		
		})


	var width = parseFloat(d3.select("#stream").style("width").replace("px",""));
	//var width = actors.length * 100;
	var height = parseFloat(d3.select("#stream").style("height").replace("px",""));

	streamkey = sven.viz.streamkey()
	.width(width)
	.height(height)
	.data(dataF)
	.barWidth(2)
	.barPadding(1)
	.minHeight(0.1)
	.colors(['#709cc2', '#a7c290'])
	.target("#stream")
	.init();
	
	});

function updateStream(){
	
	query.streamgraph(args['corpus'],function(response){
	$("#stream").empty();
	var data = response.actors;
	
	var actors = d3.keys(data);
	
	var dataF = [];
	actors.forEach(function(d){
		
		data[d].forEach(function(k){k.actor = d; k.step = k.actor; k.value = k.tf*1000; dataF.push(k);});
	
		
		})
	
	
	dataF = d3.nest().key(function(d){return d.concept}).entries(dataF).sort(function(a,b){ return b.values.length - a.values.length}).filter(function(d){return d.values.length >= 2});

	actors.forEach(function(d){
		
		dataF.forEach(function(k){
			
			var p = d3.nest().key(function(c){return c.actor}).entries(k.values)
			p = p.map(function(l){return l.key})
			if($.inArray(d, p) < 0){
				k.values.push({'actor': d, 'step':d, 'value':0})
				}
			
			k.values.sort(function(a,b){ return a.actor > b.actor? 1 : -1;})
			
			})
		
		})


	var width = parseFloat(d3.select("#stream").style("width").replace("px",""));
	//var width = actors.length * 100;
	var height = parseFloat(d3.select("#stream").style("height").replace("px",""));

	streamkey = sven.viz.streamkey()
	.width(width)
	.height(height)
	.data(dataF)
	.barWidth(2)
	.barPadding(1)
	.minHeight(0.1)
	.colors(['#709cc2', '#a7c290'])
	.target("#stream")
	.init();
	
	
	},args);

	
	}
