var query = new svenjs.Sven("http://127.0.0.1:8000");  

query.getDocuments(function(response){

var data = response.results;


// take the documents
//data = data.documents;
data = d3.values(data)
console.log(data)
//var format = d3.time.format("%Y-%m-%d");
var format = d3.time.format("%Y-%m-%dT%H:%M:%S");

	//minDate = format.parse("2010-06-10"),
	//maxDate = format.parse("2012-11-20");	

//var offset = maxDate-minDate;

/* relazioni pure
var relations = []

// creiamo connessioncine a caso...
d3.range(50).forEach(function(){
	relations.push(
		{ source: data[parseInt(data.length*Math.random())].id_document, target: data[parseInt(data.length*Math.random())].id_document }
	)
})

//associamo relazioni a oggetto

*/

//var documents = {}

data.forEach(function(d){
	d.date = format.parse(d.date);
	d.id_document = d.id;
	d.actor = '';
	for (var i in d.actors){
		d.actor = d.actor + d.actors[i].name + ' ';
		}
})


data = data.sort(function(a,b){
	return a.date > b.date ? 1 : a.date == b.date ? 0 : -1;
})


var timeline = sven.viz.timeline()
	.nodes(data)
	.target("#timeline")
	.update()


/*
var blockScale = sven.time.timeline().limit(63)

var b = sven.viz.blocks()
	.data(blockScale(dates))
	.target("#blocks")
	
var t = sven.viz.timeline()
	.data(dates)
	.target("#timeline")
	.on("change",function(d){
		/*blockScale
			.min(d3.time.month( d[0] ))
			.max(d3.time.month(d3.time.month.offset(d[1],1)))	
		
		
		blockScale
			.min(d[0])
			.max(d[1])
			
		b.data(blockScale(dates));
		b.update()
	})
	.update()


$(window).resize(function(){
	
	t.update()
	b.update()
	
})
	*/
	
});