var query = new svenjs.Sven("");  
var show = true;
var timeline;
var relArgs = {};
var nextLimit;
var nextOffset;
var total;

relArgs['corpus'] = args['corpus'];

if($.cookie('sven_filters')){
	
	args['filters'] = $.cookie('sven_filters');
	
	};

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
    
	//to do: fix filters
	langList = [{"key":"EN"},{"key":"NL"}]
	
	var docIdList = d3.nest()
    .key(function(d) { return d.id; })
    .entries(data)
    .map(function(d){return d.key});
    
    var dateList = d3.nest()
    .key(function(d) { return d.date; })
    .entries(data);
    
	var minDate = d3.min(dateList.map(function(d){return d.key}));
	var maxDate = d3.max(dateList.map(function(d){return d.key}));
    
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
		
		//reset filters
	d3.select("#filters").append("button")
		.attr("class", "btn btn-small btn-warning")
		.text("Reset filters")
		.on("click", function(){
			$.removeCookie('sven_filters', { path: '/' });
			delete args['filters'];
			args['limit'] = 50;
			args['offset'] = 0;
			
		  d3.select("#dp1").attr("data-date", minDate.split("T")[0]);
	      d3.select("#dp2").attr("data-date", maxDate.split("T")[0]);
	      d3.select("#startDate").text(minDate.split("T")[0]);
	      d3.select("#endDate").text(maxDate.split("T")[0]);
		  $("#filterContains").val("")
		  $("#selectActors").select2("val", "")
		  d3.select(".filterLang").selectAll("input").each(function(d){
		  	d3.select(this).property("checked", false)
		  })
			
		 updateTimeline();
			
			
			})
	
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
	
	
		if($.cookie('sven_filters')){
	
	d3.entries(JSON.parse(args['filters'])).forEach(function(d){
			
			loadFilters(d.key,d.value);
		
		})
	};
	
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
	$.cookie('sven_filters', JSON.stringify(filters), { path: '/'});
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
	
function loadFilters(filter,value){
		
		switch (filter){
		case "ref_date__gte":
		  if($('#dp1')){
		  $('#dp1').datepicker('setValue', value.split(" ")[0]);
	      d3.select("#startDate").text(value.split(" ")[0]);
		  }
		  break;
		case "ref_date__lte":
		  if($('#dp2')){
		  $('#dp2').datepicker('setValue', value.split(" ")[0]);
		  d3.select("#endDate").text(value.split(" ")[0]);
		  }
		  break;
		case "title__icontains":
		  if($("#filterContains")){
		  	$("#filterContains").val(value)
		  	};
		  break;
		case "language__in":
			if($(".filterLang")){
			value.forEach(function(d){
		  d3.select(".filterLang").selectAll("input").each(function(f){
		  	if(f.key == d){d3.select(this).property("checked","checked")
		  	}})
		  	});
		  	}
		  break;
		case "tags__id__in":
		  if($("#selectActors")){
		  	
		  		$("#selectActors").select2("val", value)
		 	
		  }
		  break;
		}
		
		}	