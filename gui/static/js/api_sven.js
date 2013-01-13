var svenjs = svenjs || {};

//TODO: use a more robust pattern for object creation
svenjs.Sven = function(url){
    /*
        Perform ajquery ajax call. 
        Handle json responses
    */  ;
    this.url = url;
    this.ajax = function( url, params, success, method ){
        var id = ( new Date() ).getTime();
        method = typeof method == "undefined"? 'GET': method;
        $.ajax({
            type: method,
            dataType: 'json',
            url: url,
            data: params,
            success: function( data, textStatus, jqXHR){
                console.log("[svenjs " + method + "]",id,"json received :", data.status, data );
                success.apply(this, arguments); // propagate
            },
            error: function( jqXHR, textStatus, errorThrown ){
                console.log("[svenjs " + method + "]",id," ERROR :", textStatus,  errorThrown );
                success.apply(this, arguments); // propagate
            },
            beforeSend:function( jqXHR, settings ){
                console.log("[svenjs " + method + "]",id,"url :", settings.url );
            },
            complete:function( jqXHR, textStatus ){
                // console.log("[svenjs GET]",id,"complete :", textStatus );
            }
        });
    };
    return this;

};




$(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});


/* get corpora */
svenjs.Sven.prototype.getCorpora = function(successCallback, args){
		
    var url = this.url + "/anta/api/corpus/";
    this.ajax( url, args, successCallback );
    
};


/* get a specific corpus */
svenjs.Sven.prototype.getCorpus = function(id, successCallback, args){
		
    var url = this.url + "/anta/api/corpus/" + id;
    this.ajax( url, args, successCallback );
    
};


/* add a corpus */
svenjs.Sven.prototype.addCorpus = function(successCallback, args){
		
    var url = this.url + "/anta/api/corpus/";
    this.ajax( url, args, successCallback, 'POST' );
    
};


/* get documents */
svenjs.Sven.prototype.getDocuments = function(successCallback, args){
	
    var url = this.url + "/anta/api/documents/?indent=true";
	this.ajax( url, args, successCallback );

};

/* get document */
svenjs.Sven.prototype.getDocument = function(id, successCallback, args){

		
    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/documents/" + id + "/" + "?indent=true";
    this.ajax( url, args, successCallback );
	
    
};


/* get document */
svenjs.Sven.prototype.updateDocument = function(id, successCallback, args){

    var url = this.url + "/anta/api/documents/" + id + "/" + "?method=POST&indent=true";

	var args = args || { };
	args.corpus = args.corpus || 1;

    $.ajax({
        type: 'POST',
        url: url,
        data: args,
        success: successCallback,
        error: successCallback,
        complete: function(){
        	console.log(this.url);
    		},
        dataType: 'json'
    });
    
    
};



/* delete document */
svenjs.Sven.prototype.deleteDocument = function(id, successCallback){
	
    var url = this.url + "/anta/api/documents/" + id + "/" + "?method=DELETE&indent=true";
	
    
    $.ajax({
        type: 'GET',
        url: url,
        complete: function(){
        	console.log(this.url);
    		},
        success: successCallback,
        error: successCallback,
        dataType: 'json'
    });

};

/* get relations */
svenjs.Sven.prototype.getRelations = function(successCallback, args){
	
    var url = this.url + "/anta/api/relations/?indent=true";
	
    
    $.ajax({
        type: 'GET',
        url: url,
        data: args,
        complete: function(){
        	//console.log(this.url);
    		},
        success: successCallback,
        error: successCallback,
        dataType: 'json'
    });

};

/* get relation */
svenjs.Sven.prototype.getRelation = function(id, successCallback, args){

		
    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/relations/" + id + "/" + "?indent=true";
    this.ajax( url, args, successCallback );
    
    
};

/* add relation */
svenjs.Sven.prototype.addRelation = function(successCallback, args){
	
    var url = this.url + "/anta/api/relations/?method=POST&indent=true";
	this.ajax( url, args, successCallback,'POST' );

};

/* delete relation */
svenjs.Sven.prototype.deleteRelation = function(id, successCallback){
	
    var url = this.url + "/anta/api/relations/" + id + "/" + "?method=DELETE&indent=true";
	this.ajax( url, args, successCallback );

};

/* update relation */
svenjs.Sven.prototype.updateRelation = function(id, successCallback, args){
	
    var url = this.url + "/anta/api/relations/" + id + "/" + "?method=POST&indent=true";
	this.ajax( url, args, successCallback, 'POST' );
    

};

/* download */
svenjs.Sven.prototype.download = function(id, successCallback, args){

		
    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/download/document/" + id;
    this.ajax( url, args, successCallback );
    
    
};

/* graph */
svenjs.Sven.prototype.graph = function(id, successCallback, args){
		
    var url = this.url + "/anta/api/relations/graph/corpus/" + id + "/?filters={}";
    this.ajax( url, args, successCallback );
    
};


/* streamgraph */
svenjs.Sven.prototype.streamgraph = function(id, successCallback, args){
	
    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/streamgraph/corpus/" + id + "/?filters={}";
    this.ajax( url, args, successCallback );
    
};

/* start analysis */
svenjs.Sven.prototype.startAnalysis = function(id, successCallback, args){
		
    var url = this.url + "/anta/api/tfidf/corpus/" + id;
    this.ajax( url, args, successCallback );
    
};

/* update tf-idf */
svenjs.Sven.prototype.updateAnalysis = function(id, successCallback, args){
		
    var url = this.url + "/anta/api/update-tfidf/corpus/" + id;
    this.ajax( url, args, successCallback );
    
};

/* analysis status */
svenjs.Sven.prototype.status = function(id, successCallback, args){
		
    var url = this.url + "/anta/api/status/corpus/" + id;
    this.ajax( url, args, successCallback );
    
};

/* export entities */
svenjs.Sven.prototype.exportEntities = function(id, successCallback){
		
    var url = this.url + "/anta/api/segments/export/corpus/" + id;
	this.ajax( url, args, successCallback );
    
};

/*get actors */
svenjs.Sven.prototype.getActors = function(successCallback, args){
		
    var url = this.url + "/anta/api/tags/?indent=true&filters={%22type%22:%22actor%22}&order_by=[%22name%22]";
    this.ajax( url, args, successCallback );
    
};

/*add tag to document*/
svenjs.Sven.prototype.addTag = function(id, successCallback, args){
		
    var url = this.url + "/anta/api/attach-free-tag/document/" + id +"/?indent=true";
	this.ajax( url, args, successCallback, 'POST' );
    
};

/*detach tag from document*/
svenjs.Sven.prototype.detachTag = function(docId, tagId, successCallback){
		
    var url = this.url + "/anta/api/detach-tag/document/" + docId +"/tag/" + tagId + "/?indent=true";
    this.ajax( url, args, successCallback, 'POST' );
    
};

/* switch corpus */
svenjs.Sven.prototype.switchCorpus = function(id, successCallback){
		
    var url = this.url + "/anta/api/use-corpus/" + id;
    this.ajax( url, args, successCallback, 'POST' );
    
};
