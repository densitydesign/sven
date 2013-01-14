var query = new svenjs.Sven("");
var streamkey;

streamArgs['limit'] = 15;
// get actors
	
if($.cookie('sven_filters')){
	
	args['filters'] = $.cookie('sven_filters');
	streamArgs['filters'] = $.cookie('sven_filters');
	
	};

console.log(streamArgs);

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
	
	//to do: fix filters
	langList = [{"key":"EN"},{"key":"NL"}]
    
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
		
	//reset filters
	d3.select("#filters").append("button")
		.attr("class", "btn btn-small btn-warning")
		.text("Reset filters")
		.on("click", function(){
			$.removeCookie('sven_filters', { path: '/' });
			delete args['filters'];
			delete streamArgs['filters'];
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
			
		 updateStream();
			
			
			})
		
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
	streamArgs['filters'] = JSON.stringify(filters);
	$.cookie('sven_filters', JSON.stringify(filters), { path: '/'});
	updateStream();
	}
	
		if($.cookie('sven_filters')){
	
	d3.entries(JSON.parse(args['filters'])).forEach(function(d){
			
			loadFilters(d.key,d.value);
		
		})
	};
	
	},args);

query.streamgraph(args['corpus'],function(response){
	
	if(response.status != "ok"){ return;}
	$('.loader').hide();
	var data = response.objects;
	

	/*
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
			
			k.values.sort(function(a,b){ return a.actor.toLowerCase() > b.actor.toLowerCase() ? 1 : -1;})
			
			})
		
		})

	*/
	var widthStream = parseFloat(d3.select("#stream").style("width").replace("px",""));
	//var width = actors.length * 100;
	var heightStream = parseFloat(d3.select("#stream").style("height").replace("px",""));
	var widthStreamFull = data[0].values.length * 145;
	streamkey = sven.viz.streamkey()
	//.width(data[0].values.length * 145)
	.width(widthStream)
	.height(heightStream)
	.data(data)
	.barWidth(2)
	.barPadding(5)
	.minHeight(1)
	.colors(['#709cc2', '#a7c290'])
	.target("#stream")
	.init();
	
	$('#expand').click(function(){
		
		if(widthStream < widthStreamFull)
		
		streamkey.width(widthStreamFull).update()
		
		})
	
	$('#resize').click(function(){
		
		streamkey.width(widthStream).update()
		
		})
	}, streamArgs);

function updateStream(){
	$("#stream").empty();
	$('.loader').show();
	query.streamgraph(args['corpus'],function(response){
	$('.loader').hide();
	var data = response.objects;
	


	var widthStream = parseFloat(d3.select("#stream").style("width").replace("px",""));
	//var width = actors.length * 100;
	var heightStream = parseFloat(d3.select("#stream").style("height").replace("px",""));
	var widthStreamFull = data[0].values.length * 145;

	streamkey = sven.viz.streamkey()
	.width(widthStream)
	.height(heightStream)
	.data(data)
	.barWidth(2)
	.barPadding(5)
	.minHeight(1)
	.colors(['#709cc2', '#a7c290'])
	.target("#stream")
	.init();
	
		$('#expand').click(function(){
		
		if(widthStream < widthStreamFull)
		
		streamkey.width(widthStreamFull).update()
		
		})
	
	$('#resize').click(function(){
		
		streamkey.width(widthStream).update()
		
		})
	
	},streamArgs);

	
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
		  	value.forEach(function(d){
		  		$("#selectActors").select2("val", d)
		 	 })
		  }
		  break;
		}
		
		}	
		