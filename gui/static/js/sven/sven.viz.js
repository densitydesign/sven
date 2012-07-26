(function(){
	
	sven.viz = {};
	
	sven.viz.blocks = function(){
		
		var blocks = {},
			nodes,
			links,
			target,
			width,
			height,
			line = d3.svg.line()
				.interpolate('bundle')
				.tension(1),
			interval = sven.time.timeline().limit(62), // two months as default
			event = d3.dispatch(
				"change"
			) 
			
		blocks.update = function(){
			
			d3.select(target)
				.selectAll("svg")
				.remove()
	//			.transition()
	//			.style("opacity",0)
			
			var w = width ? width : parseInt(d3.select(target).style("width")),
				h = height ? height : parseInt(d3.select(target).style("height")),
				p = [20, 10, 30, 10],
				x = d3.scale.ordinal().rangeBands([0, w - p[1] - p[3]]),
				y = d3.scale.linear().range([0, h - p[0] - p[2]]),
				z = d3.scale.ordinal().range(["lightgray"])				
				
			var svg = d3.select(target).append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.append("svg:g")
					.attr("transform", "translate(" + p[3] + "," + (h - p[2]) + ")")
			
			
			var colorGroups = d3.keys(d3.nest().key(function(d){ return d.actor; }).map(nodes))
			var color = sven.colors.diverging(colorGroups.length);
			colorGroups.forEach(function(d){
				color(d);
			})
			var groups = interval(nodes).map(function(d){
				return {
					x:new Date(d.key),
					y: +d.value.length,
					children: d.value,
				//	offset : off
				};
			})
			
			var maxElements = d3.max(groups.map(function(d){ return d.y; }))
			var elementHeight = y.range()[1]/maxElements;
			var fixHeight = 16;
			var openess = 600;
			
			// azzeriamo nodi...
			nodes.forEach(function(d){
				d._visible = false;
				d._open = false;
			})
			
		
			
			x.domain(groups.map(function(d) { return d.x; }));
			y.domain([0, d3.max(groups, function(d) { return d.y0 + d.y; })]);


			
			// main container
			var container = svg.append("svg:g")
				.attr("class", "container")
			//	.style("fill", "#f4f4f4")
			//	.style("stroke", "#ffffff");


			
			// add a group for each
			var group = container.selectAll("g.group")
				.data(groups)
				.enter().append("svg:g")
					.attr("class", "group")
				//	.attr("x", function(d){ return x(d.x); } )
				//	.attr("y", function(d){ return  -y.range()[1]; })
					.attr("fill","#f4f4f4")
					.attr("transform",function(d){ return "translate(" + x(d.x) + "," + - y.range()[1] + ")" })
					.each(function(d){ d._node = this; })
					
			//group.transition()
			//	.attr("transform",function(d){ return "translate(" + (x(d.x) + d.offset * openess) + "," + - y.range()[1] + ")" })
			var back = group.append("svg:rect")
				.attr("class","back")
				.attr("width", x.rangeBand())
				.attr("height", function(){ return y.range()[1] } )
				.attr("fill","#f4f4f4")
				.attr("stroke", "#ffffff")
			
					var linkGroups = container.append("svg:g")
						.attr("class", "links")
						.attr("transform",function(d){ return "translate(0," + - y.range()[1] + ")" })
				
				var sxNode = linkGroups.selectAll("rect.sx")
					.data([{ _x:-x.rangeBand(), _y:y.range()[1]/2 }])
					.enter().append("svg:rect")
						.attr("class","sx")
						.attr("x",-10)
						.attr("width",0)
						.attr("height",0)
						.attr("y",y.range()[1]/2)

				var dxNode = linkGroups.selectAll("rect.dx")
					.data([{ _x:d3.last(x.range()) + x.rangeBand(), _y:y.range()[1]/2 }])
					.enter().append("svg:rect")
					.attr("class","dx")
					.attr("x", d3.last(x.range()) + x.rangeBand())
					.attr("width",0)
					.attr("height",0)
					.attr("y",y.range()[1]/2)
					
				
				
			// add a rect for each date.
			var rect = group.selectAll("rect.node")
				.data(function(d){ return d.children; })
				.enter().append("svg:rect")
					.attr("class", "node")
					.attr("id", function(d){ return "node-" + d.id_document; })
					.attr("y", function(d,i,b) { return i*elementHeight + (y.range()[1] -elementHeight*(groups[b].children.length-1))/2 ; })//return y.range()[1] - (i+1)*elementHeight - elementHeight*(groups[b].children.length-1); })
					.attr("height", fixHeight)//elementHeight)
					.attr("width", x.rangeBand())
					.attr("fill", function(d){ return color.values()[d.actor]; })
					.attr("stroke", "#ffffff")//function(d){ return d3.rgb(color.values()[d.actor]).darker(); })
					.on("mouseover", function(d){ fill_tooltip(d);  $("#tooltip").show();})
					.on("mousemove", function(){ var w = $("#tooltip").width(); var h = $("#tooltip").height(); $("#tooltip").css({top: (d3.event.pageY - h-20) + "px", left: (d3.event.pageX - w/2 ) + "px"});})
					.on("mouseout", function(){ return $("#tooltip").hide();})
					.on("click", function(d){ getRelations(d, d.id)})
					.each(function(d){
						d._visible = true;
						d._node = this;
						d._parentNode = this.parentNode;
						d._x = parseFloat(x(d3.select(this.parentNode).data()[0].x)); 
						d._y = parseFloat(d3.select(this).attr("y"));
					})
			
			var getRelations = function(d, source) {
			query.getRelations(function(response){

    		var relations = response.results;
    		if (relations){
    			console.log(relations)
    			
    			}
    		d.relations = relations;
    		drawOneLinks();
    		},{filters:'{"source":' + source + '}'});
    		};
			/*
			var rectLabel = group.selectAll("text.label")
				.data(function(d){ return d.children; })
				.enter().append("svg:text")
					.attr("class", "label")
//					.attr("y", function(d,i) { return y.range()[1] - (i+1)*elementHeight; })
					.attr("y", function(d,i,b) { return i*elementHeight + (y.range()[1] -elementHeight*(groups[b].children.length-1))/2 ; })//return y.range()[1] - (i+1)*elementHeight - elementHeight*(groups[b].children.length-1); })
					.attr("dx",5)
					.attr("dy",fixHeight-4)
					.style("font-weight","bold")
					.style("fill",function(d){ return d3.rgb(color.values()[d.actor]).darker() ; })
					.style("text-shadow","0px 1px 0px rgba(255,255,255,.3)")
					.attr("opacity",1)
					.text(function(d){ return d3.time.format("%d/%m")(d.date) +" "+ d.actor; })
			
		
			
			/*
			// label per ogni rect prova
			var nodeLabel = group.selectAll("text.label")
				.data(function(d){ return d.children; })
				.enter().append("svg:text")
				.attr("class","label")
				.attr("y", function(d,i) { return y.range()[1] - (i+1)*elementHeight + 10; })
			//	.text(function(d){ return d.id_document; })
					
					
			
			var visibles = nodes.filter(function(d){ return d._visible; }).map(function(d){ return d.id_document; });
			
			var visibleLinks = links.filter(function(d){
				return visibles.indexOf(d.source) != -1 && visibles.indexOf(d.target) != -1 ? true : false; // ora solo quando entrambi
			})
			visibleLinks.forEach(function(d){ 
				d.sourceNode = nodes.filter(function(n){ return n.id_document == d.source; })[0]
				d.targetNode = nodes.filter(function(n){ return n.id_document == d.target; })[0]
			//	console.log(curve([d.sourceNode,d.targetNode]))
			})
			
			//console.log(visibleLinks)
		
			var link = linkGroups.selectAll("path.link")
				.data(visibleLinks)
				.enter().append("svg:path")
				.attr("class","link")
				.attr("d",function(d){ return curve([d.sourceNode,d.targetNode]); })
			
		*/
		d3.select("#legend").selectAll("div.legend")
			.data(d3.entries(color.values()))
			.enter().append("div")
				.attr("class","legend")
			//	.style("width","20px")
			//	.style("height","20px")
				.style("background-color",function(d){ return d.value; })
				.text(function(d){ return d.key; })
				.style("color",function(d){ return d3.rgb(d.value).darker(); })
				.attr("title", function(d){ return d.key; })
		
		d3.select(target).selectAll("div.details").remove()
		//drawLinks();
	
		
				
		function curve(items) {
			
			items.sort(function(a,b){
				return a._x < b._x ? -1 : a._x == b._x ? 0 : 1;
			})
			
			
			var points = [
				[ items[0]._x + x.rangeBand() - 5, items[0]._y + fixHeight/2 ],
				[ items[0]._x + x.rangeBand() + (items[1]._x-items[0]._x)/4, items[0]._y + fixHeight/2 ],
				[ items[1]._x - (items[1]._x-items[0]._x)/4, items[1]._y + fixHeight/2],
				[ items[1]._x + 5, items[1]._y + fixHeight/2 ]
			]
		
			return line(points)
		}
		
		
		function updatePosition(){
			var item = d3.select(d3.event.target).data()[0];	
			
			/*interval.min(interval.interval().offset(interval.min(),1))
			interval.max(interval.interval().offset(interval.max(),1))
			blocks.update()
			*/
			//drawLinks(item.id_document)
			
			var open = item._open;
			rect.each(function(n){ n._open = false; })
			
			group.each(function(n){
				d3.select(n._node)
					.transition()
					.attr("transform",function(d){ return "translate(" + x(d.x) + "," + - y.range()[1] + ")" })
				d3.select(n._node)
					.select(".back")
					.transition()
					.attr("width",x.rangeBand())
					.attr("fill","#f4f4f4")
			})
			
			
			item._open = !open;
			var verso = d3.last(x.range()) - openess - item._x > 0 ? 0 : 1;
			
			
			d3.select(d3.event.target.parentNode)
				.select(".back")
				.transition()
				.attr("width", function(d){ return item._open ? openess+x.rangeBand() : x.rangeBand(); } )
				.attr("fill",function(d){ return item._open ? "#f8f8f8" : "#f4f4f4"; })
			
			group.each(function(n){
				
				var offset = item._x >= x(n.x) ? 0 : 1;
				n._offset = offset == verso ? 0 : offset > verso ? 1 : -1;
				d3.select(n._node)
					.transition()
					.attr("transform",function(d){ return "translate(" + (x(d.x) + d._offset * openess * item._open) + "," + - y.range()[1] + ")" })
					.each(function(d){ d._x = (x(d.x) + d._offset * openess * item._open); d._y = - y.range()[1]; })
			})
			
			// div con info...solo se è aperto...
			d3.select(target).selectAll("div.details").remove()
			
			linkGroups.style("opacity",1)
			
			if(item._open){
				
				linkGroups.style("opacity",0)
			
				var details = d3.select(target).selectAll("div.details")
					.data([item])
					.enter().append("div")
						.attr("class","details")
						.style("width", openess -40 + "px")
						.style("height",y.range()[1] - 80 +"px")
						.style("left",function(d){ return d._parentNode.__data__._x + x.rangeBand() + 40 + "px"; })
						.style("top","290px")
			
				$(".details").ajaxStart(function(){
				   details.style("background","url(/static/css/images/ajax-loader.gif) no-repeat center")
				 });

				$(".details").ajaxStop(function(){
				   details.style("background","none")
				 });
			
				details.append("div")
					.attr("class","date")
					.html(function(d){return d3.time.format("%B %e, %Y")(d.date);})
			
				details.append("h3")
					.html(function(d){return d.title;})
				
				details.append("div")
					.attr("class","actor")
					.html(function(d){return d.actor;})
			
				details.append("div")
					.attr("class","tags")
			
				details.select(".tags").selectAll("div.tag").remove()

				var tag = details.select(".tags").selectAll("div.tag")
					.data(item.entities)
					.enter().append("div")
						.attr("class", "tag")
			
				tag.append("div")
					.attr("class","arrow")
			
				var tag_cont = tag.append("div")
					.attr("class","tag_cont")
			
				tag_cont.append("div")
					.attr("class","tag_text")
					.text(function(en){ return en.t; })
			
				tag_cont.append("div")
					.attr("class","tag_number")
					.text(function(en){ return en.f; })
			
				tag_cont.append("div")
					.attr("class","clear")
			
				tag.append("div")
					.attr("class","clear")
					
				details.select(".tags").append("div")
					.attr("class","clear")
				
				details.append("div")
					.attr("class","clear")
			/*
				details.select(".tags").html('<div class="clear"></div>');
				*/
				
				
				
				details.append("div")
					.attr("class","options")
				
				details.select(".options").append("span")
					.attr("class","btn")
					.text("Load text")
					.on("click",function(){
						$.ajax({

							url :"/api/document/",
							data : { "document": item.id_document },
							success : function(result){
								console.log(result.document);
								details.append("p")
									.attr("class","fulltext")
									.text(result.document.fullText)
							}

						})
						
					})
				
				details.select(".options").append("span")
					.attr("class","btn")
					.text("Edit relationships")
				
				// chiediamo il testo paura che casino sto cidice cazzo!
			
				
			
			}
		}
		
		
		function drawLinks(){
			
			
						
			var visibles = {}
			var paths = []
			
			rect.each(function(r){ visibles[r.id_document] = r; })
			
			//var relations = d3.entries(visibles).map(function(d){ return d.value.relations; })
			
			d3.entries(visibles).forEach(function(v){
				console.log(v);
				if (!v.value.hasOwnProperty('relations')) return;
				v.value.relations.forEach(function(d){
					
				if (!visibles.hasOwnProperty(d.source) && !visibles.hasOwnProperty(d.target)) return;
				
				var sourceNode,
					targetNode;
				sourceNode = visibles.hasOwnProperty(d.source) ? visibles[d.source] : v.value.date > blocks.nodesAsObject()[d.source].date ? sxNode.data()[0] : dxNode.data()[0];
				targetNode = visibles.hasOwnProperty(d.target) ? visibles[d.target] : v.value.date < blocks.nodesAsObject()[d.target].date ? sxNode.data()[0] : dxNode.data()[0];
				paths.push({ sourceNode:sourceNode, targetNode:targetNode, description:d.description });
				})
			})
			
			var link = linkGroups.selectAll("path.link")
				.data(paths)
				.enter().append("svg:path")
				.attr("class","link")
				.style("stroke-width",4)
				.attr("d",function(d){ return curve([d.sourceNode,d.targetNode]); })
				.on("mouseover",function(d){ console.log(d.description); })
				
			
			/*

			var visibleLinks = links.filter(function(d){
				return visibles.indexOf(d.source) != -1 && visibles.indexOf(d.target) != -1 ? true : false; // ora solo quando entrambi
			})
			visibleLinks.forEach(function(d){ 
				d.sourceNode = nodes.filter(function(n){ return n.id_document == d.source; })[0]
				d.targetNode = nodes.filter(function(n){ return n.id_document == d.target; })[0]
			//	console.log(curve([d.sourceNode,d.targetNode]))
			})

			//console.log(visibleLinks)

			
			*/
		
	
		}
		
		function drawOneLinks(){
			
			
						
			var visibles = {}
			var paths = []
			
			rect.each(function(r){ visibles[r.id_document] = r; })
			
			//var relations = d3.entries(visibles).map(function(d){ return d.value.relations; })
			
			d3.entries(visibles).forEach(function(v){

				if (!v.value.hasOwnProperty('relations')) return;
				v.value.relations.forEach(function(d){
					
				if (!visibles.hasOwnProperty(d.source) && !visibles.hasOwnProperty(d.target)) return;
				
				var sourceNode,
					targetNode;
				sourceNode = visibles.hasOwnProperty(d.source) ? visibles[d.source] : v.value.date > blocks.nodesAsObject()[d.source].date ? sxNode.data()[0] : dxNode.data()[0];
				targetNode = visibles.hasOwnProperty(d.target) ? visibles[d.target] : v.value.date < blocks.nodesAsObject()[d.target].date ? sxNode.data()[0] : dxNode.data()[0];
				paths.push({ sourceNode:sourceNode, targetNode:targetNode, description:d.description });
				})
			})
			
			var link = linkGroups.selectAll("path.link")
				.data(paths)
				.enter().append("svg:path")
				.attr("class","link")
				.style("stroke-width",4)
				.attr("d",function(d){ return curve([d.sourceNode,d.targetNode]); })
				.on("mouseover",function(d){ console.log(d.description); })
				
			
			/*

			var visibleLinks = links.filter(function(d){
				return visibles.indexOf(d.source) != -1 && visibles.indexOf(d.target) != -1 ? true : false; // ora solo quando entrambi
			})
			visibleLinks.forEach(function(d){ 
				d.sourceNode = nodes.filter(function(n){ return n.id_document == d.source; })[0]
				d.targetNode = nodes.filter(function(n){ return n.id_document == d.target; })[0]
			//	console.log(curve([d.sourceNode,d.targetNode]))
			})

			//console.log(visibleLinks)

			
			*/
		
	
		}
						

		var fill_tooltip = function(d){
							var dt = new Date(d.date);
							var format= d3.time.format("%B %e, %Y");
						$("#tooltip .date").text(format(dt));
						$("#tooltip h3").text(d.title.replace(/_/gi," "));
						$("#tooltip .actor").text(d.actor);
						//aggiungi d.relations.length
						$("#tooltip .relations	 .bold").text(function(){return d.hasOwnProperty('relations') ? d.relations.length : 0});
						
						//per ogni tag aggiungi un elemento tag
					//	var tag = '<div class="tag"><div class="arrow"></div><div class="tag_cont"><div class="tag_text">'+'aggiugi testo'+'</div><div class="tag_number">'+'00'+'</div><div class="clear"></div></div><div class="clear"></div></div>'
					//	$("#tooltip .tags").html(tag);
						/*
						d3.select("#tooltip .tags").selectAll("div.tag").remove()
						
						var tag = d3.select("#tooltip .tags").selectAll("div.tag")
							.data(d.entities.slice(0,3))
							.enter().append("div")
								.attr("class","tag")
						
						tag.append("div")
							.attr("class","arrow")
						
						var tag_cont = tag.append("div")
							.attr("class","tag_cont")
						
						tag_cont.append("div")
							.attr("class","tag_text")
							.text(function(en){ return en.t; })
						
						tag_cont.append("div")
							.attr("class","tag_number")
							.text(function(en){ return en.f; })
						
						tag_cont.append("div")
							.attr("class","clear")
						
						tag.append("div")
							.attr("class","clear")
						
						$("#tooltip .tags").append('<div class="clear"></div>');
						*/
						}
		
			
		var label = group.append("svg:text")
			.attr("class","label")
			.attr("y", y.range()[1])
			.attr("text-anchor", "middle")
			.attr("dy", 15)
			.attr("dx",x.rangeBand()/2)
			.text(function(d){return interval.format()(d.x)});
				
		return blocks;
			
		}
			
		blocks.nodes = function(x) {
			if (!arguments.length) return nodes;
			nodes = x;
			return blocks;
		}
		
		blocks.nodesAsObject = function() {
			var nodesAsObject = {}
			nodes.forEach(function(d){
				nodesAsObject[d.id_document] = d;
			})
			return nodesAsObject;
		}

		blocks.links = function(x) {
			if (!arguments.length) return links;
			links = x;
			return blocks;
		}

		blocks.target = function(x) {
			if (!arguments.length) return target;
			target = x;
			return blocks;
		}
		
		blocks.interval = function(x) {
			if (!arguments.length) return interval;
			interval = x;
			return blocks;
		}
				
		blocks.width = function(x) {
			if (!arguments.length) return width;
			width = x;
			return blocks;
		}
		
		blocks.height = function(x) {
			if (!arguments.length) return height;
			height = x;
			return blocks;
		}

		blocks.on = function(type, listener) {
			events.on(type,listener)
			return blocks;
		}	
		
		return blocks;
	}
	
	sven.viz.stack = function(){
		
		var stack = {},
			data,
			target,
			width,
			height,
			brush,
			interval = sven.time.timeline().limit(20),
			events = d3.dispatch(
				"change"
			)
		
		stack.update = function() {
			
			d3.select(target).selectAll("svg").remove()
			
			var w = width ? width : parseInt(d3.select(target).style("width")),
				h = height ? height : parseInt(d3.select(target).style("height")),
				p = [20, 10, 30, 10],
				x = d3.scale.ordinal().rangeBands([0, w - p[1] - p[3]]),
				x2 = d3.scale.ordinal().rangeBands([0, w - p[1] - p[3]]), // for days-level brush
				y = d3.scale.linear().range([0, h - p[0] - p[2]]),
				z = d3.scale.ordinal().range(["lightgray"])
			
			var svg = d3.select(target).append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.append("svg:g")
					.attr("transform", "translate(" + p[3] + "," + (h - p[2]) + ")");

			// groups... now forced to value...
			var groups = d3.layout.stack()(["value"].map(function(group) {
				return interval(data).map(function(d) {
					return { x: new Date(d.key), y: +d[group].length };
				});
			}));
			
			// for a daily brush
			var dailyRange = sven.time.days()
				.min(d3.first(groups[0]).x)
				.max( d3.time.day.offset(interval.interval().offset((d3.last(groups[0]).x),1),1) )
				(data)

			var dailyGroups = d3.layout.stack()(["value"].map(function(cause) {
				return dailyRange.map(function(d) {
					return { x: new Date(d.key), y: +d[cause].length };
				});
			}));
						
			x.domain(groups[0].map(function(d) { return d.x; }));
			y.domain([0, d3.max(groups[groups.length - 1], function(d) { return d.y0 + d.y; })]);
			x2.domain( dailyGroups[0].map(function(d) { return d.x; }) );
						
			brush = d3.svg.brush()
				.x(x2)
				.on("brush", bru);
			
			// Add a group for each cause.
			var cause = svg.selectAll("g.cause")
				.data(groups)
				.enter().append("svg:g")
					.attr("class", "cause")
					.style("fill", function(d, i) { return z(i); })
					.style("stroke", "#ffffff");

			// Add a rect for each date.
			var rect = cause.selectAll("rect")
				.data(Object)
				.enter().append("svg:rect")
					.attr("x", function(d) { return x(d.x); })
					.attr("y", function(d) { return -y(d.y0) - y(d.y); })
					.attr("height", function(d) { return y(d.y); })
					.attr("width", x.rangeBand());

			  // Add a label per date.
			  var label = svg.selectAll("text")
			      .data(x.domain())
			    .enter().append("svg:text")
				  .attr("class","label")
			      .attr("x", function(d) { return x(d) + x.rangeBand() / 2; })
			      .attr("y", 6)
			      .attr("text-anchor", "middle")
			      .attr("dy", ".71em")
			      .text(interval.format())
				.on("click",function(d){ 					
				//	events.change([d,d3.time.month.offset(d,1)])
				});
			
				 svg.append("g")
				      .attr("class", "x brush")
				      .call(brush)
				    .selectAll("rect")
				      .attr("y", -h)
				      .attr("height", h );
			
			bru();
			
			function bru(){
				//console.log([x.domain()[d3.bisect(x.range(), brush.extent()[0]) - 1], x.domain()[d3.bisect(x.range(), brush.extent()[1]) - 1]])
				brush.empty() ? events.change([d3.first(x2.domain()),d3.last(x2.domain())]) : events.change([x2.domain()[d3.bisect(x2.range(), brush.extent()[0]) - 1], x2.domain()[d3.bisect(x2.range(), brush.extent()[1]) - 1]])
			}
			
			return timeline;
		}
		
		stack.data = function(x) {
			if (!arguments.length) return data;
			data = x;
			return stack;
		}

		stack.interval = function(x) {
			if (!arguments.length) return interval;
			interval = x;
			return stack;
		}

		stack.target = function(x) {
			if (!arguments.length) return target;
			target = x;
			return stack;
		}
		
		stack.width = function(x) {
			if (!arguments.length) return width;
			width = x;
			return stack;
		}
		
		stack.height = function(x) {
			if (!arguments.length) return height;
			height = x;
			return stack;
		}

		stack.on = function(type, listener) {
			events.on(type,listener)
			return stack;
		}
		
		return stack;
		
	}
	
	sven.viz.timeline = function(){
		
		var timeline = {},
			data,
			nodes,
			links,
			target,
			stack,
			blocks,
			event = d3.dispatch(
				"change"
			)
		
		timeline.update = function(){
			
			// remove...
			d3.select(target)
				.selectAll(".timeline").remove()
			
			// create the stack div
			var stackDiv = d3.select(target)
				.append("div")
				.attr("class","blocks")
				
			// create the stack div
			var stackDiv = d3.select(target)
				.append("div")
				.attr("class","stack")
			
			blocks = sven.viz.blocks()
				.nodes(nodes)
				.links(links)
				.target(".blocks")
				.interval(sven.time.timeline().limit(62))
						
			stack = sven.viz.stack()
				.data(nodes)
				.interval(sven.time.timeline().limit(30))
				.target(".stack")
				.height(100)
				.on("change",function(d){
					blocks.interval()
						.min(d[0])
						.max(d[1])
					blocks.update();
				})
				.update()
			
		}
		
		timeline.data = function(x) {
			if (!arguments.length) return data;
			data = x;
			return timeline;
		}

		timeline.nodes = function(x) {
			if (!arguments.length) return nodes;
			nodes = x;
			return timeline;
		}

		timeline.links = function(x) {
			if (!arguments.length) return links;
			links = x;
			return timeline;
		}

		timeline.target = function(x) {
			if (!arguments.length) return target;
			target = x;
			return timeline;
		}

		timeline.on = function(type, listener) {
			event.on(type,listener)
			return timeline;
		}

		return timeline;
		
	}
	
	
	
	/*
	sven.viz.blocks = function(){
		
		var blocks = {},
			data,
			target,
			width,
			height
			
			
		blocks.update = function(){
			
			d3.select(target).selectAll("svg").remove()
			
			var w = width ? width : parseInt(d3.select(target).style("width")),
				h = height ? height : parseInt(d3.select(target).style("height")),
				p = [20, 10, 30, 10],
				x = d3.scale.ordinal().rangeBands([0, w - p[1] - p[3]]),
				y = d3.scale.linear().range([0, h - p[0] - p[2]]),
				z = d3.scale.ordinal().range(["lightgray"]),
				parse = d3.time.format("%m/%Y").parse,
				format = d3.time.format("%d/%m"),
				color = sven.colors.diverging();
				
			var svg = d3.select(target).append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.append("svg:g")
					.attr("transform", "translate(" + p[3] + "," + (h - p[2]) + ")")

		//	console.log(data.filter(function(d){ return d.value != 0; }).length)
			
			var groups = data.map(function(d){
				return { x:new Date(d.key), y: +d.value.length, children: d.value };
			})
			
			
			x.domain(groups.map(function(d) { return d.x; }));
			y.domain([0, d3.max(groups, function(d) { return d.y0 + d.y; })]);
			
			var maxElements = d3.max(groups.map(function(d){ return d.y; }))
			var elementHeight = y.range()[1]/maxElements;
			//console.log(maxElements, )
			// main container
			var container = svg.append("svg:g")
				.attr("class", "container")
				.style("fill", "#f4f4f4")
				.style("stroke", "#ffffff");
			
			// add a group for each
			var group = container.selectAll("g.group")
				.data(groups)
				.enter().append("svg:g")
					.attr("class", "group")
					.attr("transform",function(d){ return "translate(" + x(d.x) + "," + - y.range()[1] + ")" })
			
			var back = group.append("svg:rect")
				.attr("width", x.rangeBand())
				.attr("height", function(){ return y.range()[1] } )
				.attr("fill","#f4f4f4")
				
			
			// Add a rect for each date.
			var rect = group.selectAll("rect.gigi")
				.data(function(d){ return d.children; })
				.enter().append("svg:rect")
					.attr("class","gigi")
			//		.attr("x", 0)//function(d) { return x(d.x); })
					.attr("y", function(d,i) { return y.range()[1] - (i+1)*elementHeight; })
					.attr("height", elementHeight)
					.attr("width", x.rangeBand())
					.attr("fill", function(d){ return color([d.actor]); })
					.call(function(d,i){ console.log(d); })
							
			
			  // Add a label per date.
			  var label = svg.selectAll("text")
			      .data(x.domain())
			    .enter().append("svg:text")
			      .attr("x", function(d) { return x(d) + x.rangeBand() / 2; })
			      .attr("y", 6)
			      .attr("text-anchor", "middle")
			      .attr("dy", ".71em")
				  .style("font-size","10px")
			      .text(format);
						
			return blocks;
			
		}
			
		blocks.data = function(x) {
			if (!arguments.length) return data;
			data = x;
			return blocks;
		}

		blocks.target = function(x) {
			if (!arguments.length) return target;
			target = x;
			return blocks;
		}

		blocks.on = function(type, listener) {
			events.on(type,listener)
			return blocks;
		}	
		
		return blocks;
	}
	
	sven.viz.timeline = function(){
		
		var timeline = {},
			data,
			target,
			width,
			height,
			brush,
			events = d3.dispatch(
				"change"
			)
		
		timeline.update = function() {
			
			d3.select(target).selectAll("svg").remove()
			
			var w = width ? width : parseInt(d3.select(target).style("width")),
				h = height ? height : parseInt(d3.select(target).style("height")),
				p = [20, 10, 30, 10],
				x = d3.scale.ordinal().rangeBands([0, w - p[1] - p[3]]),
				x2 = d3.scale.ordinal().rangeBands([0, w - p[1] - p[3]]),
				y = d3.scale.linear().range([0, h - p[0] - p[2]]),
				z = d3.scale.ordinal().range(["lightgray"]),
				parse = d3.time.format("%m/%Y").parse,
				format = d3.time.format("%b %Y");
			
			var svg = d3.select(target).append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.append("svg:g")
					.attr("transform", "translate(" + p[3] + "," + (h - p[2]) + ")");

			var crimea = sven.time.months()(data)

			var causes = d3.layout.stack()(["value"].map(function(cause) {
				return crimea.map(function(d) {
					return {x: new Date(d.key), y: +d[cause].length};
				});
			}));
			
			var crimea2 = sven.time.days().min(d3.first(causes[0]).x).max( d3.time.day.offset(d3.time.month.offset((d3.last(causes[0]).x),1),1) )(data)

			var causes2 = d3.layout.stack()(["value"].map(function(cause) {
				return crimea2.map(function(d) {
					return {x: new Date(d.key), y: +d[cause].length};
				});
			}));
						
			x.domain(causes[0].map(function(d) { return d.x; }));
			y.domain([0, d3.max(causes[causes.length - 1], function(d) { return d.y0 + d.y; })]);
			x2.domain(causes2[0].map(function(d) { return d.x; }));
						
			brush = d3.svg.brush()
				.x(x2)
				.on("brush", bru);
			
			// Add a group for each cause.
			var cause = svg.selectAll("g.cause")
				.data(causes)
				.enter().append("svg:g")
					.attr("class", "cause")
					.style("fill", function(d, i) { return z(i); })
					.style("stroke", "#ffffff");

			// Add a rect for each date.
			var rect = cause.selectAll("rect")
				.data(Object)
				.enter().append("svg:rect")
					.attr("x", function(d) { return x(d.x); })
					.attr("y", function(d) { return -y(d.y0) - y(d.y); })
					.attr("height", function(d) { return y(d.y); })
					.attr("width", x.rangeBand());

			  // Add a label per date.
			  var label = svg.selectAll("text")
			      .data(x.domain())
			    .enter().append("svg:text")
			      .attr("x", function(d) { return x(d) + x.rangeBand() / 2; })
			      .attr("y", 6)
			      .attr("text-anchor", "middle")
			      .attr("dy", ".71em")
			      .text(format)
				.on("click",function(d){ 
					console.log(d)
					
				//	events.change([d,d3.time.month.offset(d,1)])
					
				});
			
				 svg.append("g")
				      .attr("class", "x brush")
				      .call(brush)
				    .selectAll("rect")
				      .attr("y", -h)
				      .attr("height", h );
			
			bru();
			
			function bru(){
				//console.log([x.domain()[d3.bisect(x.range(), brush.extent()[0]) - 1], x.domain()[d3.bisect(x.range(), brush.extent()[1]) - 1]])
				brush.empty() ? events.change([d3.first(x2.domain()),d3.last(x2.domain())]) : events.change([x2.domain()[d3.bisect(x2.range(), brush.extent()[0]) - 1], x2.domain()[d3.bisect(x2.range(), brush.extent()[1]) - 1]])
			}
			
			return timeline;
		}
		
		timeline.data = function(x) {
			if (!arguments.length) return data;
			data = x;
			return timeline;
		}

		timeline.target = function(x) {
			if (!arguments.length) return target;
			target = x;
			return timeline;
		}

		timeline.on = function(type, listener) {
			events.on(type,listener)
			return timeline;
		}
		
		return timeline;
	}
	*/
})();