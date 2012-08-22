var anta = anta || { initialisables:[] };


anta.init = function(){
	anta.toast("welcome guy!")
	anta.log("[anta.init]","ehi dude");
	for( var f in anta.initialisables ){
		eval( anta.initialisables[f] )( );	
	}
}

anta.templates ={}
anta.elements = {}
anta.events = {
	'ul_list_changed':'ul_list_changed',
	'ul_list_element_added':'ul_list_element_added'

}


anta.upload = { is_dragging:false }
/*
    plugin blueimp
*/
anta.upload.init = function(){
	anta.log("[anta.upload.init]");
	$("#fileupload").fileupload({
		url: anta.urls.upload,
		dataType: 'json',
		done: function(e, data){
			anta.log(e, data.result);
		},
		fail: function( e, data ){
			anta.log("failed!", data.error);
		},
		progressall: function(e, data){
			var progress = parseInt(data.loaded / data.total * 100, 10);
			anta.log("progress:",progress)
		},
		dragover: function(e,data){

			if( anta.upload.is_dragging ) return;

			anta.upload.is_dragging = true;
			
			anta.log("[anta.upload.dragover] started...");
		},
		drop: function( e, data){
			anta.upload.is_dragging = false;
			anta.log("[anta.upload.always] something happened...");
		}
	})
}

/*
    ========================
    ---- EVENT HANDLERS ----
    ========================

	custom event handler sample
	$("#foo").on( anta.events.dummy, function(event, data){console.log(event,data);})	
	custom event trigger
	$("#foo").trigger( anta.events.dummy,{foo:"bar"});
*/
anta.handlers = {}
anta.handlers.init = function(){
	

}

anta.handlers.api = {

}


anta.handlers.api = {}
anta.handlers.api.fault = function( message ){
	alert( message );
}
anta.handlers.api.insert = function(){}

anta.handlers.api.update = function(){}

anta.handlers.api.get = function(){}

anta.handlers.api.delete = function( what, id ){
	if (typeof( id ) == "number"){
		$( "#" + what + "_" + id).remove();
	} 
}


/*
    =======================
    ---- MAGIC METHODS ----
    =======================

	custom function for delete/add/modify html objects
*/
anta.magic = {}
anta.magic.invalidate = function(){

}


//
//    ============================
//    ---- TEMPLATES ELEMENTS ----
//    ============================
//
anta.templates.elements = {}

anta.templates.elements.documents = function( instance ){// instance = {id:12, title:"A title"})
	d = $("<li/>", {"class":"document", id:"document_id_" + instance.id, 'data-id':instance.id }).append(
		"<div>" + instance.title +"</div>"
	)
	return d
}

anta.templates.elements.tags = function( instance ){// instance = {id:12, title:"A title"})
	d = $("<li/>", {"class":"tag", id:"tag_id_" + instance.id, 'data-id':instance.id }).append(
		"<span>" + instance.title +"</span><div class='remove'></div>"
	)
	return d
}
/*
	Return a jquery object of type <ul> containing all instances specified.
	If the list element exists, only instances not already added will be appended.

	@param type 		- 		
	@param instances 	- array of instance
	@params meta 		- api meta object( with filters, limit, offset, next, previous, total_count among the others )
	
*/
anta.templates.ul_list_of = function( type, instances, meta ){ // type='documents', instances= [ i1, i2, ..., in ]
	
	if ( typeof( anta.elements[ type ] ) == "undefined" ){ anta.elements[ type ] = [] }

	var l = $("#list-of-" + type );
	l = l.length? l : $("<ul/>",{'class':"list-of", id: "list-of-" + type });

	for (i in instances){
		if ( anta.elements[ type ].length && indexOf(anta.elements[ type ]) != -1 ){
			// substitute DIRECT children
			l.children( "#" + type + "_" + instances[i] ).replaceWith( anta.templates[ type ]( instances[i] ) );
		} else {
			l.append( anta.templates[ type ]( instances[i] ) );
			l.trigger(ul_list_element_added)
			anta.elements[ type ] = instances[i].id;
		}
	}
	l.trigger( anta.events.ul_list_changed, {type:type, meta:meta})
	return l
}

// new anta.api({url:, data:{}, id:1234, handler:document })
// urls like 
anta.api = function( options ){
	
	this.settings = $.extend({
		url:null,
		method:'GET',
		data:{},
		dataType:"post",
		success: this.success,
		error: this.fault,
		handler: undefined,
		magic: undefined // specials, magic calls

	}, options );
	
	this.success = function( result ){
		if( result.status=="ko" ){
			// auto invalidate fields
			anta.magic.invalidate();
			return this.fault( result.error )
		
		} 

		if ( typeof this.settings.magic != "undefined" ){
			return this.settings.magic( result );
		}

		// default handlers 
		if (this.settings.data.method == "delete"){
			return anta.handlers.api.delete( this.settings.handler, this.settings.id );
		} 

		// post update and insert
		if (this.settings.data.method == "post" ){
			if ( typeof this.settings.id != undefined ){
				return anta.handlers.api.update[ this.settings.handler ](id, result);
			}
			return anta.handlers.api.insert[ this.settings.handler ](result);
		}
		
		// get single and list
		if (this.settings.data.method == "get" ){
			if( typeof this.settings.id != undefined ){
				return anta.handlers.api.get[ this.settings.handler ]( this.settings.id )
			}
			return anta.handlers.api.get[ this.settings.handler ]()
			// anta.handlers.get.list_of( result.meta ) 
			// anta.templates.ul_list_of = function( type, instances, meta ){
		}

		return this.fault( "unsupported method", result );
	}

	this.fault = function( message ){
		anta.handlers.api.fault( message );
	}


	// try ajax call
	try{
		$.ajax( this.settings );
	} catch( e) {
		anta.api.handlers.fault( e );
	}
}

/*
    ===================
    ---- UTILITIES ----
    ===================

	Some functions: toast, log and objects size and values mapping
*/
anta.sizeOf = function(obj) {
    var size = 0;
    var key;
    for (key in obj) { if (obj.hasOwnProperty(key)) size++;}
    return size;
};

anta.valuesOf = function(obj){
	var C,d=0,Z=[];for(C in obj){if(!obj.hasOwnProperty(C)){continue;}Z[d++]=obj[C];}return Z;
}

anta.log = function(){
	// use this function instead of console.log
	try{
		console.log.apply(console, arguments);
	} catch(e){
		alert("logging function not enabled!");
	}
}

anta.toast = function( message, title, options ){
	
	if( !options || !title ){
		options={};
	} 
	if( typeof title == "object" ){
		options = title;
		title = undefined;
	}
	
	if( options.cleanup != undefined )
		$().toastmessage('cleanToast');
		
	var settings = $.extend({
		text: "<div>" + (!title?'<h1>'+ message +'</h1>':"<h1>"+ title +"</h1><p>"+ message +"</p>") +"</div>",
		type: 'notice',
		position:'middle-center',
		inEffectDuration: 200,
		outEffectDuration: 200,
		stayTime:3000
	}, options);
	$().toastmessage('showToast', settings );
}

/*
	Replace matches of /0/ recursively with given binds.
    e.g anta.refactor("/anta/api/documents/0/corpus/0/",[2,3])
	returns "/anta/api/documents/2/corpus/3/"
*/
anta.refactor = function( url, binds ){
	if( typeof binds == "number" ){
		binds = [ binds ];
	}
	for (i in binds){
		url = url.replace("/0/", "/" + binds[i] + "/");
	}
	return url;
}


/*
    ====================
    ---- CSFR token ----
    ====================

	CSFR token workaround (cfr. Django)
*/
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

