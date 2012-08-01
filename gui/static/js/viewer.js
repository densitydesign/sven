function pdfViewer(pdfUrl, type, target){    // Disable workers to avoid yet another cross-origin issue (workers need the URL of
    // the script to be loaded, and currently do not allow cross-origin scripts)
    PDFJS.disableWorker = true;

    var pdfDoc = null;
    var currentPage = 1;
    var scale = 1;
    var totalPages = 0;
    
	var containerD3 = d3.select('#' + type + '_document .' + target + '');
	var containerJQ = $('#' + type + '_document .' + target + '');
	var zoomMapper = d3.scale.linear().domain([1,2,3,4,5,6,7,8,9,10]).range([0.15,0.33,0.5,0.66,0.75,0.9,1,1.5,2,2.5])

    //
    // Get page info from document, resize canvas accordingly, and render page
    //
    function renderPage(num) {
      // Using promise to fetch the page
      
      var divPage = containerD3.append('div').attr('id', type + '_page_'+num+'').attr('name', type + '_page_'+num+'').style('background', 'white').style('display', 'inline-block');
	  //var newCanvas = $('<canvas />');
	  //var canvas = $('#' + type + '_document #page_' + num + '').append(newCanvas);
	  var canvas = document.getElementById(''+ type +'_page_'+num+'').appendChild(document.createElement("canvas"));
      //var prova = $('#' + type + '_document #page_' + num + ' canvas');
     var ctx = canvas.getContext('2d')
      pdfDoc.getPage(num).then(function(page) {
      	
        var viewport = page.getViewport(scale);
        canvas.height = viewport.height;
        canvas.width = viewport.width;
		divPage.style('width', canvas.width + 'px' );
        // Render PDF page into canvas context
        var renderContext = {
        
          canvasContext: ctx,
          viewport: viewport
        };
        page.render(renderContext);
        
        //scrollto se c'è zoom
        if (num == currentPage){
		var current = $('#' + type + '_document #'+ type +'_page_' + currentPage + '')
        containerJQ.scrollTo( 
  		current,
  		200
  		);
  		}
        
     });

    }


function zoom(zoomLevel, container){
	if (zoomLevel < 1 || zoomLevel > 10){return;}
	else{
	scale = zoomMapper(zoomLevel);
	//container.selectAll('div').remove();
	container.empty();
	for (var i=1;  i<=totalPages; i++){
      	renderPage(i); 	
      	}

  	}
	}


function isScrolledIntoView(elem,container) {
    //var docViewTop = container.scrollTop();
   //var docViewBottom = docViewTop + container.height();
	var docViewOffset = container.offset().top;
    var elemTop = $(elem).position().top - docViewOffset;
    var elemBottom = elemTop + $(elem).height();
    return ( (elemTop <= 0 ) && ( elemBottom > 0));
}


function getCurrentPage(elem, container){
	var page;
	elem.each(function() {
            if (isScrolledIntoView($(this), container) == true){
            	var pageName = $(this).attr('name');
            	page = pageName.split('_')[2];            	
            	}
        });
	return page
	}

$('#' + type + '_document #prev').click(function() {

	currentPage = getCurrentPage($('#' + type + '_document .container div'),containerJQ);
	if (currentPage == 1){}
	else{
	currentPage--;
	var prev = $('#' + type + '_document #' + type + '_page_'+ currentPage +'');
  	containerJQ.scrollTo( 
  		prev,
  		500
  		);
  	}
});

$('#' + type + '_document #next').click(function() {

	currentPage = getCurrentPage($('#' + type + '_document .container div'),containerJQ)
	if (currentPage == totalPages){}
	else{
	currentPage++;
	var next = $('#' + type + '_document #' + type +'_page_'+ currentPage +'');
  	containerJQ.scrollTo( 
  		next,
  		500
  		);
  	}
});

$('#' + type + '_document #in').click(function() {
	var currentZoom = zoomMapper.invert(scale);
	currentZoom++;
	zoom(currentZoom, containerJQ);
	});

$('#' + type + '_document #out').click(function() {
	var currentZoom = zoomMapper.invert(scale);
	currentZoom--;
	zoom(currentZoom, containerJQ);
	});


    //
    // Asynchronously download PDF as an ArrayBuffer
    //
    PDFJS.getDocument(pdfUrl).then(function getPdfHelloWorld(_pdfDoc) {
      pdfDoc = _pdfDoc;
      
    	totalPages =  pdfDoc.numPages;
      
      for (var i=1;  i<=totalPages; i++){
      	renderPage(i);
      	
      	}
      
    });
    
    }