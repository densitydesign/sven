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
			interval = sven.time.timeline().limit(31), // two months as default
			event = d3.dispatch(
				"change"
			),
			visibles = {},
			paths = []
			

		blocks.update = function(){
			
			d3.select(target)
				.selectAll("svg")
				.remove()
			
			var w = width ? width : parseInt(d3.select(target).style("width")),
				h = height ? height : parseInt(d3.select(target).style("height")),
				p = [20, 10, 30, 10],
				x = d3.scale.ordinal().rangeBands([0, w - p[1] - p[3]]),
				y = d3.scale.linear().range([0, h - p[0] - p[2]]),
				z = d3.scale.ordinal().range(["lightgray"])
			
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
			
			var svg = d3.select(target).append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.append("svg:g")
					.attr("transform", "translate(" + p[3] + "," + (h - p[2]) + ")")
						
			var colorGroups = d3.keys(d3.nest().key(function(d){ return d.actor; }).map(nodes))
			var color = sven.colors.diverging(colorGroups.length);
			colorGroups.forEach(function(d){
				color(d);
				console.log(d)
			})
			
			var groups = interval(nodes).map(function(d){
				return {
					x:new Date(d.key),
					y: +d.value.length,
					children: d.value,
				};
			})
			
			var maxElements = d3.max(groups.map(function(d){ return d.y; }))
			var fixHeight = 16;
			var elementHeight = y.range()[1]/maxElements;
			
			// azzeriamo nodi...
			nodes.forEach(function(d){
				d._visible = false;
				d._open = false;
				d.relations = [];
				d.showRelations = d.hasOwnProperty('showRelations') ? d.showRelations : true;
			})
						
			
			// azzeriamo links...
			links.forEach(function(d,i){
				
				var sourceNode = blocks.nodesAsObject(d.source),
					targetNode = blocks.nodesAsObject(d.target);

				sourceNode.relations.push(d);
				//targetNode.relations.push(d);
			})
			
						
			x.domain(groups.map(function(d) { return d.x; }));
			y.domain([0, d3.max(groups, function(d) { return d.y0 + d.y; })]);
			
			// main container
			var container = svg.append("svg:g")
				.attr("class", "container")
			
			// add a group for each
			var group = container.selectAll("g.group")
				.data(groups)
				.enter().append("svg:g")
					.attr("class", "group")
					.attr("fill","#f4f4f4")
					.attr("transform",function(d){ return "translate(" + x(d.x) + "," + - y.range()[1] + ")" })
					.each(function(d){ d._node = this; })
			
			// sfondo		
			var back = group.append("svg:rect")
				.attr("class","back")
				.attr("width", x.rangeBand())
				.attr("height", function(){ return y.range()[1] } )
				.attr("fill","#f4f4f4")
				.attr("stroke", "#ffffff")
			
			// links
			var linkGroups = container.append("svg:g")
				.attr("class", "links")
				.attr("transform",function(d){ return "translate(0," + - y.range()[1] + ")" })
			
			// nodo finto a sinistra	
			var sxNode = linkGroups.selectAll("rect.sx")
				.data([{ _x:-x.rangeBand(), _y:y.range()[1]/2 }])
				.enter().append("svg:rect")
					.attr("class","sx")
					.attr("x",-10)
					.attr("width",0)
					.attr("height",0)
					.attr("y",y.range()[1]/2)
			
			// nodo finto a destra
			var dxNode = linkGroups.selectAll("rect.dx")
				.data([{ _x:d3.last(x.range()) + x.rangeBand(), _y:y.range()[1]/2 }])
				.enter().append("svg:rect")
				.attr("class","dx")
				.attr("x", d3.last(x.range()) + x.rangeBand())
				.attr("width",0)
				.attr("height",0)
				.attr("y",y.range()[1]/2)
					
			// add a rect for each date						
			var rect = group.selectAll("rect.node")
				.data(function(d){ return d.children; })
				.enter().append("svg:rect")
					.attr("class", "node")
					.attr("id", function(d){$(this).popover({placement:"top", trigger:"hover"}); return "node-" + d.id_document; })
					.attr("y", function(d,i,b) { return i*elementHeight + (y.range()[1] -elementHeight*(groups[b].children.length-1))/2 ; })
					//vecchia y return y.range()[1] - (i+1)*elementHeight - elementHeight*(groups[b].children.length-1); })
					.attr("height", fixHeight)
					.attr("width", x.rangeBand())
					//.attr("fill", function(d){ return color.values()[d.actor]; })
					.attr("fill", "LightGrey")
					.attr("stroke", "#ffffff")//function(d){ return d3.rgb(color.values()[d.actor]).darker(); })
					.attr("rel", "popover")
					.attr("data-content",function(d){var dt = new Date(d.date);var format= d3.time.format("%B %e, %Y"); var content =  "<p>" + format(dt) + "</p><p>actor: <b>" + d.actor + "</b></p><p>relations: <b>" + d.relations_count + "</b></p>"; return content;} )
					.attr("data-original-title", function(d){ return d.title })
					.on("click", function(d){ window.location = "/gui/documents/" + d.id + "/"})
					.each(function(d){
						d._visible = true;
						d._node = this;
						d._parentNode = this.parentNode;
						d._x = parseFloat(x(d3.select(this.parentNode).data()[0].x)); 
						d._y = parseFloat(d3.select(this).attr("y"));
					});
			
			// toggle for links
			group.selectAll("image.toggle-link")
				.data(function(d){ return d.children; })
				.enter().append("image")
				.attr("class","toggle-link")
				.attr("xlink:href", staticUrl + "css/images/links.png")
  				.attr("x", x.rangeBand()/2 - fixHeight/2)
  				.attr("y", function(d,i,b) { return i*elementHeight + (y.range()[1] -elementHeight*(groups[b].children.length-1))/2 ; })
			    .attr("width", 16)
				.attr("height", 16)
				.attr("rel","tooltip")
				.attr("title",function(d){
					return d.showRelations ? "Hide " + d.relations_count + " relations" : "Show " + d.relations_count + " relations";
				})
				.on("click", function(d){
					d.showRelations = !d.showRelations;
					d3.event.target.__data__.relations.forEach(function(r){
						r.path.visible = d.showRelations;
					})					
					blocks.update();
				})
				
			
			$('.toggle-link').tooltip({placement:"top", trigger:"hover"})
			
			paths = []
			visibles = {}
			
			rect.each(function(r){ visibles[r.id_document] = r; })
			
			links.forEach(function(d){
				
				// controlliamo che source e target non siano entrambi fuori range o che la relazione sia invisibile (togglata)
				if (!visibles.hasOwnProperty(d.source) && !visibles.hasOwnProperty(d.target) || d.path && !d.path.visible) return;
				
				var sourceNode = visibles.hasOwnProperty(d.source) ?
					visibles[d.source] : blocks.nodesAsObject(d.target).date > blocks.nodesAsObject(d.source).date ?
						sxNode.data()[0] : dxNode.data()[0]
				
				var targetNode = visibles.hasOwnProperty(d.target) ?
					visibles[d.target] : blocks.nodesAsObject(d.source).date > blocks.nodesAsObject(d.target).date ?
						sxNode.data()[0] : dxNode.data()[0]
				
				var path = {
					id: d.id,
					visible:true,
					sourceNode:sourceNode,
					targetNode:targetNode,
					description:d.description,
					polarity: d.polarity
				}
					
				if (!paths.filter(function(j){ return j.id==d.id; }).length) {
					paths.push(path);
					d.path = path;
				}
			})
			
			
			
			linkGroups.selectAll("path.link")
				.data(paths)
				.enter().append("svg:path")
				.attr("class","link")
				.attr("rel","tooltip")
				.attr("title",function(d){return d.description})
				.style("stroke-width",fixHeight/4)
				.attr("stroke-linecap","butt")
				.style("stroke",function(d){return sven.colors.polarity(d.polarity)})
				.style("opacity",function(d){ return d.visible? 1 : 0; })
				.attr("d",function(d){ return curve([d.sourceNode,d.targetNode]); })
				.on("click", function(d){window.location = "/gui/relations/"+ d.id})
				.on("mouseover",function(d){ d3.select(".desc")
											.select(".tooltip-inner")
											.text(d.description);

											d3.select(".desc")
											.attr("class","tooltip fade in desc")
											.attr("style","top: " + (d3.event.pageY - $(".desc").height() -15 ) + "px; left:"+ (d3.event.pageX - $(".desc").width()/2 ) + "px")

							 })
				.on("mousemove",function(d){d3.select(".desc").attr("style","top: " + (d3.event.pageY - $(".desc").height() - 15) + "px; left:"+ (d3.event.pageX - $(".desc").width()/2) + "px");})
				.on("mouseout",function(d){d3.select(".desc").attr("class","tooltip fade out desc")})	
			
			var label = group.append("svg:text")
				.attr("class","timeline-label")
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
		
		blocks.nodesAsObject = function(id) {
			var nodesAsObject = {}
			nodes.forEach(function(d){
				nodesAsObject[d.id_document] = d;
			})
			if (!arguments.length) return nodesAsObject;
			return nodesAsObject[id];
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
			brush = d3.svg.brush(),
			interval = sven.time.timeline().limit(20),
			events = d3.dispatch(
				"change"
			)
		
		stack.update = function() {
			
			if (!data) return;
						
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
				.style("margin-top", "30px")
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

			brush
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
				  .attr("class","timeline-label")
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
			
			function bru(){
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
			
			stack = sven.viz.stack()
				.interval(sven.time.timeline().limit(30))
				.target("#stack")
				.height(100)
				.on("change",function(d){
					blocks.interval()
						.min(d[0])
						.max(d[1])
					blocks.update();
				}),

			blocks = sven.viz.blocks()
				.target("#blocks")
				.interval(sven.time.timeline().limit(31)),
			
			event = d3.dispatch(
				"change"
			)
			
		
		timeline.update = function(){
			
			if (!nodes || !links)
				return;
			
			blocks
				.nodes(nodes)
				.links(links)
				.update();
			
			stack
				.data(nodes)
				.update();
				
			return timeline;
			
		}
		

		timeline.nodes = function(x) {
			if (!arguments.length) return nodes;
			nodes = x;
			timeline.update();
			return timeline;
		}

		timeline.links = function(x) {
			if (!arguments.length) return links;
			links = x;
			timeline.update();
			return timeline;
		}

		timeline.target = function(x) {
			if (!arguments.length) return target;
			target = x;
			timeline.update();
			return timeline;
		}

		timeline.on = function(type, listener) {
			event.on(type,listener)
			return timeline;
		}

		return timeline;
		
	}
	
	sven.viz.network = function(){
		
		var network = {},
			vis = {},
			labels,
			layout,
			nodes = [],
			links = [],
			target,
			width = 1000,
			height = 500,
			label = function(d){ return d; },
			id = function(d){ return d; },
			event = d3.dispatch(
				"nodeClick"
			)
			
		network.on = function(type, listener) {
			event.on(type,listener)
			return network;
		}
		
		network.nodes = function(filters) {
			if (!arguments.length) return nodes;
			return filter(nodes, d3.entries(filters))
		}
		
		network.links = function(filters) {
			return links;
		}
		
		network.label = function(x){
			if (!arguments.length) return label;
			label = x;
			return network;
		}
		
		network.id = function(x){
			if (!arguments.length) return id;
			id = x;
			return network;
		}
		
		network.target = function(x){
			if (!arguments.length) return target;
			target = x;
			return network;
		}
		
		
		/** Adding link to the network **/
		network.addLink = function(sourceNode, targetNode, weight) {
			
			if(arguments.length < 2)
				return;
			weight = weight || 1;
			// adding the nodes
			network.addNodes([sourceNode, targetNode])
			sn = network.nodes({'_id' : sourceNode._id})[0]
			tn = network.nodes({'_id' : targetNode._id})[0]
			links.push({source: sn, target: tn, value:weight});
			network.update();
		}	
		
		/** Adding nodes to the network **/
		network.addNodes = function(newNodes){
			
			if(!arguments.length)
				return;
				
				newNodes.forEach(function(newNode){
					
					/** let's check if the node exists (if a node with the same _id exists) **/
					if (network.nodes({'_id' : newNode._id }).length)
						return; // if exists... maybe update?
					
					var point = [0,0],
						node = { 
							x: point[0],
							y: point[1],
							data: newNode
						}
						
					nodes.push(node);
				})
			
				network.update();
			
		}		
		
		network.update = function() {

			// links
			vis.select("g.links").selectAll("path.link")
				.data(links)
				.enter().insert("svg:path")
				.attr("class", function(d) { return "link"; })
				.attr("d", function(d) {
					var dx = d.target.x - d.source.x,
					dy = d.target.y - d.source.y,
					dr = Math.sqrt(dx * dx + dy * dy);
					return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
				});
						
			// nodes
			vis.select("g.nodes").selectAll("circle.node")
				.data(nodes)
				.enter().insert("svg:circle")
				.attr("class", "node")
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })
				.attr("r", 20)
				.on("click",function(d){ event.nodeClick(d) })
				.call(layout.drag);
			
			// labels				
			// A copy of the text with a thick white stroke for legibility.
			vis.select("g.labels").selectAll("text.label")
				.data(nodes)
				.enter().insert("svg:text")
				.attr("class", "label")
				.attr("x", 0)
			    .attr("y", 5)
			    .attr("class", "shadow")
			    .text(function(d) { return label(d); });
			
			
			vis.select("g.labels").selectAll("text.label")
				.data(nodes)
				.enter().insert("svg:text")
					.attr("class", "label")
					.attr("x", 0)
				    .attr("y", 5)
				    .text(function(d) { return label(d); });
			
			/*
			var k = Math.sqrt(nodes.length / (width * height));
			layout
				.charge(-200 / k)
				.gravity(100 * k)
					
			layout.start();
			*/
		}
		
		// init the svg
		d3.select(target).selectAll("svg")
			.remove()
			
		vis = d3.select("body").append("svg:svg")
			.attr("width", width)
			.attr("height", height);

		// a background
		vis.append("svg:rect")
			.attr("width", width)
			.attr("height", height);
		
		// init force layout
		layout = d3.layout.force()
			.charge(-200)
		 	.linkDistance(120)
			.nodes(nodes)
			.links(links)
			.size([width, height])
		
		// links
		vis.append("svg:g")
			.attr("class", "links")
		
		// nodes
		vis.append("svg:g")
			.attr("class", "nodes")
		
		// labels
		vis.append("svg:g")
			.attr("class", "labels")
		
		layout.on("tick", function() {
			
			// update links
			vis.selectAll("path.link")
				.attr("d", function(d) {
					var dx = d.target.x - d.source.x,
						dy = d.target.y - d.source.y,
						dr = Math.sqrt(dx * dx + dy * dy);
						return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
				});
			
			// update circles
			vis.selectAll("circle.node")
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
			
			// update labels
			vis.selectAll("text")
				.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
			});
		
		});		
		
		//network.update();
		
		
		/** helper for filtering elements **/
		function filter(items, filters){
			
			if (filters.length == 0)
				return items
					
			currentFilter = filters.shift()
			return filter(items.filter(function(element){
				return element.data[currentFilter.key] == currentFilter.value;
			}), filters)
		}
		
		return network;
				
	}
	
	sven.viz.graph = function(){
				
		var graph = {},
			sig,
			center,
			zoomIn,
			zoomOut,
			target,
			nodes = [],
			nodesIndex = {},
			edges = [],
			edgesIndex = {},
			clusters,
			size,
			color = d3.scale.category20(),
			id,
			label,
			event = d3.dispatch(
				"nodeDown",
				"nodeUp"
			)
			/*
			downnodes,
			upnodes,
			downgraph,
			upgraph,
			overnodes,
			outnodes
			*/
		
		graph.center = function(){
			sig.position(0,0,1).draw();
			return graph;
		}
		
		graph.zoomIn = function(){
			var a = sig._core;
	    	sig.zoomTo(a.domElements.nodes.width / 2, a.domElements.nodes.height / 2, a.mousecaptor.ratio * (1.5));
			return graph;
		}
				
		graph.zoomOut = function(){
			var a = sig._core;
	    	sig.zoomTo(a.domElements.nodes.width / 2, a.domElements.nodes.height / 2, a.mousecaptor.ratio * (0.5));
			return graph;
		}
		
		graph.target = function(x){
			if (!arguments.length) return target;
			target = x;
			return graph;
		}
		
		graph.id = function(x){
			if (!arguments.length) return id;
			id = x;
			return graph;
		}
		
		graph.label = function(x){
			if (!arguments.length) return label;
			label = x;
			return graph;
		}
		
		
		graph.on = function(type, listener){
			if (arguments.length < 2) return;
			event.on(type,listener)
			return graph;
		}
		
		graph.getEdges = function(){
			return edges;
		}
		
		graph.getNodes = function(){
			return nodes;
		}
		
		
		graph.addNode = function(data){
			
			idNode = id ? id(data) : 'undefined_' + nodes.length;
			if (nodesIndex[idNode]) return;
			
			// TODO: mah...
			
			sig.addNode(idNode,{
	  	         'x': Math.random(),
	  	         'y': Math.random(),
	  	         'size': data.size,
				 //'color': color(idNode),
				 'color': "grey",
				 'label' : label(data)
	  	       });
			   nodes.push(data);
			   nodesIndex[idNode] = data;
			   
	  	     sig.startForceAtlas2();
			 return graph;
				
		}
		
		graph.removeNode = function(data){
			
			sig.dropNode();// con id
		}
		
		
		graph.addEdge = function(source, target, properties){
			sig.addEdge(
				Math.random(),
				id(source),
				id(target),
				properties
			)
			
			sig.startForceAtlas2();
		}
		
		
		function updateEdges(){
						
		}
		
		graph.start = function() {
			sig.startForceAtlas2();
		}
		
		graph.stop = function() {
			sig.stopForceAtlas2();
		}
		
		graph.init = function(){
					
			sig = sigma.init(d3.select(target).node())
				.drawingProperties({
					/*
					defaultLabelColor: '#444444',
			       defaultLabelSize: 0,
			       defaultLabelBGColor: '#ff0000',//'rgba(0,0,0,0)',
				   labelHoverBGColor: 'rgba(0,0,0,0)',
			       defaultLabelHoverColor : 'rgba(0,0,0,0)',
			       labelThreshold: 6,
				   labelHoverShadow: false,
			       defaultEdgeType: 'curve',
				   */
			       // -------
			       // LABELS:
			       // -------
			       //   Label color:
			       //   - 'node'
			       //   - default (then defaultLabelColor
			       //              will be used instead)
			       defaultLabelSize: 12,
			       labelColor: '#000',
			       defaultLabelColor: '#000',
			       //   Label hover background color:
			       //   - 'node'
			       //   - default (then defaultHoverLabelBGColor
			       //              will be used instead)
			       labelHoverBGColor: 'default',
			       defaultHoverLabelBGColor: 'rgba(0,0,0,0)',
			       //   Label hover shadow:
			       labelHoverShadow: false,
			       labelHoverShadowColor: '#000',
			       //   Label hover color:
			       //   - 'node'
			       //   - default (then defaultLabelHoverColor
			       //              will be used instead)
			       labelHoverColor: 'default',
			       defaultLabelHoverColor: '#000',
			       //   Label active background color:
			       //   - 'node'
			       //   - default (then defaultActiveLabelBGColor
			       //              will be used instead)
			       labelActiveBGColor: 'default',
			       defaultActiveLabelBGColor: '#fff',
			       //   Label active shadow:
			       labelActiveShadow: false,
			       labelActiveShadowColor: '#000',
			       //   Label active color:
			       //   - 'node'
			       //   - default (then defaultLabelActiveColor
			       //              will be used instead)
			       labelActiveColor: 'default',
			       defaultLabelActiveColor: '#000',
			       //   Label size:
			       //   - 'fixed'
			       //   - 'proportional'
			       //   Label size:
			       //   - 'fixed'
			       //   - 'proportional'
			       labelSize: 'fixed',
			       labelSizeRatio: 2,    // for proportional display only
			       labelThreshold: 0,
				   defaultEdgeType: 'curve',
			       borderSize: 2,
			       nodeBorderColor: '#fff',
			       defaultNodeBorderColor: '#fff'
			       
				   
			     }).graphProperties({
			       minNodeSize: 4,
			       maxNodeSize: 10,
			       minEdgeSize: 1,
			       maxEdgeSize: 20
			     }).mouseProperties({
			       maxRatio: 4
			     }).configProperties({
					 auto : false,
					 drawLabels : true,
					 drawHoverNodes: true,
					 //drawActiveNodes: true
			     })
					 
			/* Mouse listeners 

			sig.bind("downnodes",function(d){
				console.log(d3.event)
				mouse = sig.getMouse()
				d3.select("#pop-up")
				.style("left", mouse.mouseX+"px")
				.style("top", mouse.mouseY+"px")
				.style("display","block")
				
				event.nodeDown(nodesIndex[d.content[0]]);
			})
			
			sig.bind("upnodes",function(d){
				console.log('up',d)
			})
			
			*/
			
			// sig.bind('overnodes', function(event){
// 				
// 				var _nodes = event.content;
// 				var _neighbors = {};
// 				
// 				sig.iterEdges(function(e){
// 					if(_nodes.indexOf(e.source)>=0 || _nodes.indexOf(e.target)>=0){
// 						
// 						
// 						 if(!e.attr['grey']){
//           e.attr['true_color'] = e.color;
//           e.color = sig.getNodes(e.source).color;
//           e.attr['grey'] = 1;
//         }
//       }else{
//         e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
//         e.attr['grey'] = 0;
//         
// 						_neighbors[e.source] = 1;
// 						_neighbors[e.target] = 1;
// 					}
// 				}).iterNodes(function(n){
// 					/*
// 					if(!_neighbors[n.id]){
// 						n.hidden = 1;
// 					}else{
// 						n.hidden = 0;
// 					}
// 					*/
// 					if(!_neighbors[n.id]){
//         if(!n.attr['grey']){
//           n.attr['true_color'] = n.color;
//           //n.color = "#f5f5f5";
//           n.attr['grey'] = 1;
//         }
//       }else{
//         n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
//         n.attr['grey'] = 0;
//       }
// 				})//.draw(2,2,2);
// 			
// 			}).bind('outnodes',function(){
// 				sig.iterEdges(function(e){
// 					//e.hidden = 0;
// 					e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
// 				
//       e.attr['grey'] = 0;
// 				}).iterNodes(function(n){
// 					//n.hidden = 0;
// 					n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
//       n.attr['grey'] = 0;
// 				})//.draw(2,2,2);
// 			});
			
			
			return graph;
		}
		
	
	return graph;
		
		
		
	}
	
})();
