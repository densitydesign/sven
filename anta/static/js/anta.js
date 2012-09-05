/*



*/
var anta = anta || { initialisables:[], resizeables:[] };


anta.init = function(){
	anta.toast("loaging...")
	anta.log("[anta.init]","ehi dude");
	anta.resize();
	
	$("[title]").tooltip(); // init tooltip

	for( var f in anta.initialisables ){
		eval( anta.initialisables[f] )( );	
	}
	$(window).on("resize", anta.resize );

}

anta.resize = function( event ){
	anta.log(event);
	var $w = $(window)
	anta.width = $w.width();
	anta.height = $w.height();
	for( var f in anta.resizeables ){
		eval( anta.resizeables[f] )( );	
	}
}


anta.vars = {}
anta.templates ={}
anta.elements = {}
anta.events = {
	'ul_list_changed':'UL_LIST_CHANGED',
	'ul_list_element_added':'UL_LIST_ELEMENT_ADDED',
	'attach_tag':'ATTACH_TAG',
	'detach_tag':'DETACH_TAG',
	'itemSelected':'ITEM_SELECTED',
	'itemUnselected':'ITEM_UNSELECTED',
	'selectionChanged':'SELECTION_CHANGED', 
	'selectionEmpty':'SELECTION_EMPTY'
}

/*
    ============================
    ---- SELECTION HANDLERS ----
    ============================
*/
anta.selection = {};
anta.selection.init = function(){
	anta.log("[anta.selection.init]");
	
	$(window).on( anta.events.itemSelected, anta.selection.select );
	$(window).on( anta.events.itemUnselected, anta.selection.unselect );
}
anta.selection.check = function( type ){
	if ( typeof anta.elements[ type+"_selected" ] == "undefined" ){ anta.elements[ type+"_selected" ] = [] };
}
anta.selection.add = function( type, id ){
	anta.selection.check( type );
	if( anta.elements[ type+"_selected" ].indexOf( id ) == -1 ){
		anta.elements[ type+"_selected" ].push( id );
	}
}
anta.selection.remove = function( type, id ){
	anta.selection.check( type );
	var i = anta.elements[ type+"_selected" ].indexOf( id );
	anta.log("[anta.selection.remove]",type, id, "indexOf:",i);
	if ( i != -1){
		return anta.elements[ type+"_selected" ].splice(i, 1);
	}
	return -1;
}

anta.selection.select = function( event, data ){
	anta.selection.add( data.type, data.id );
	$(window).trigger( anta.events.selectionChanged,{ type:data.type, collection: anta.elements[ data.type+"_selected" ]})
}

anta.selection.unselect = function( event, data ){
	anta.log("[anta.selection.unselect]", data.type, data.id);
	anta.selection.remove( data.type, data.id );
	if( anta.elements[ data.type+"_selected" ].length == 0 ){
		anta.log("[anta.selection.unselect]", anta.events.selectionEmpty);
		$(window).trigger( anta.events.selectionEmpty,{ type:data.type, collection: anta.elements[ data.type+"_selected" ]});	
	}

}


/*
    ==========================
    ---- HOTKEYS HANDLERS ----
    ==========================
*/
anta.hotkeys = { map:{ 115:"s", 116:"t", 100:"d"  } }
anta.hotkeys.init = function(){
	anta.log("[anta.hotkeys.init]");
	$(window).on("keypress", function( event ){
		anta.log(event);
	});
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
anta.handlers.api.fault = function( data ){
	anta.log( data );
	anta.toast( i18n.translate( data.error ), i18n.translate( "error"), {"cleanup":true, stayTime:2000 });
}
anta.handlers.api.insert = function(){}

anta.handlers.api.update = function(){}

anta.handlers.api.get = {}
anta.handlers.api.get.documents = function( result ){
	anta.log( "[anta.handlers.api.get.documents]", result);
	anta.templates.ul_list_of( 'documents', result.results, result.meta );

}

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

anta.magic.show_todays_specials = function( event, data ){
	anta.log("[anta.magic.show_today_specials]", event, data );
	$("#todays-specials").show()
	$("#selection-total-count").text( "" + data.collection.length );
}
anta.magic.hide_todays_specials = function( event, data ){
	anta.log("[anta.magic.hide_today_specials]", event, data );
	$("#todays-specials").hide()
	$("#selection-total-count").text( "0" );
}


//
//    ============================
//    ---- TEMPLATES ELEMENTS ----
//    ============================
//
anta.templates.elements = {}

anta.templates.elements.documents = function( instance ){// instance = {id:12, title:"A title"})
	
	var content = $("<div/>",{"class":"content"}).html(
		'<a href="' + anta.refactor( anta.urls.view_document, instance.id ) + '">' + instance.title + '</a>' 
	);

	for(var i in instance.tags){
		content.append(  anta.templates.elements.tags( instance.tags[i]) )
	}
	content.append( '<div class="tag add">&nbsp;</div>' );

	d = $("<li/>", {"class":"document item", id:"documents_" + instance.id, 'data-id':instance.id }).append(
		'<div class="check floating"><input type="checkbox" data-id="' + instance.id + '" name="check_'+ instance.id +'"/></div>',
		'<div class="actions floating right"><div class="edit" data-id="' + instance.id + '"></div><div class="remove" data-type="document" data-id="' + instance.id + '"></div></div>',
		content,
		'<div class="clear"></div>'
	)
	return d
}

anta.templates.elements.tags = function( instance ){// instance = {id:12, title:"A title"})
	d = $("<div/>", {"class":"tag", id:"tags_" + instance.id, 'data-id':instance.id }).append(
		'<div class="remove"></div>',
		"<span>" + instance.name +"</span>"
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
		if ( anta.elements[ type ].length && anta.elements[ type ].indexOf( instances[i].id ) != -1 ){
			// substitute DIRECT children
			l.children( "#" + type + "_" + instances[i].id ).replaceWith( anta.templates.elements[ type ]( instances[i] ) );
		} else {
			l.append( anta.templates.elements[ type ]( instances[i] ) );
			// l.trigger('ul_list_element_added',{element:})
			anta.elements[ type ].push( instances[i].id );
		}
	}

	$("#" + type + "-total-count").text( meta.total );

	l.trigger( anta.events.ul_list_changed, {type:type, meta:meta})
	return l
}


anta.lock = { element:[], enabled:false }
anta.lock.init = function(){
	anta.log("[anta.lock.init]");
	anta.lock.element = $("<div/>", { id:"preloader"}).append('<div id="percentage">0.0 %</div>');
	$("body").append( anta.lock.element );
	anta.lock.resize();
	

	anta.resizeables.push("anta.lock.resize");

}
anta.lock.resize = function(){
	anta.lock.element.width( anta.width ).height( anta.height );
}
anta.lock.enable = function( options ){
	var settings = $.extend({clean:false, timeout:-1},options);

	if( anta.lock.enabled ) return;
	anta.lock.enabled = true;
	if( settings.clean ){
		$("#percentage").hide();
	} else {
		$("#percentage").show();
	}
	anta.lock.element.show().addClass("fadein");
}
anta.lock.disable = function(){
	if( !anta.lock.enabled ) return;
	anta.lock.enabled = false;
	anta.lock.element.removeClass("fadein");
}
	
// new anta.api({url:, data:{}, id:1234, handler:document })
// urls like 
anta.api = function( options ){
	
	var instance = this

	this.settings = $.extend({
		url:null,
		method:'GET',
		data:{},
		dataType:"json",
		success: undefined,
		error: this.fault,
		handler: undefined,
		magic: undefined // specials, magic calls

	}, options );
	
	if( this.settings.success == undefined ){
		this.settings.success = function( result ){
			if( result.status=="ko" ){
				// auto invalidate fields
				anta.magic.invalidate();
				return anta.handlers.api.fault( result );
			} 

			if ( typeof instance.settings.magic != "undefined" ){
				return instance.settings.magic( result );
			}
			anta.log( result );
			// default handlers 
			if ( result.meta.method == "DELETE"){
				return instance.handlers.api.delete( this.settings.handler, this.settings.id );
			} 

			// post update and insert
			if ( result.meta.method == "POST" ){
				if ( typeof this.settings.id != undefined ){
					return anta.handlers.api.update[ this.settings.handler ](id, result);
				}
				return anta.handlers.api.insert[ this.settings.handler ](result);
			}
			
			// get single and list
			if (result.meta.method == "GET" ){
				if( typeof instance.settings.id != undefined ){
					return anta.handlers.api.get[ instance.settings.handler ]( result, instance.settings.id )
				}
				return anta.handlers.api.get[ instance.settings.handler ]( result )
				// anta.handlers.get.list_of( result.meta ) 
				// anta.templates.ul_list_of = function( type, instances, meta ){
			}

			return anta.handlers.api.fault({ error:"unsupported method"} );
		}

	}
	


	$.ajax( this.settings );
	
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

/*
    ===========================
    ---- i18n translations ----
    ===========================
*/
i18n = { lang:"en-US", languages:[ "en-US", "fr-FR", "it-IT" ] }
i18n.dict = {}
i18n.dict["en-US"] ={
	"error":"Error",
	"incomplete": "Something is missing!"
}
i18n.dict["fr-FR"] ={
	"error":"Erreur"
}
i18n.switch = function( language ){
	i18n.lang = language;
}
i18n.translate = function( what ){

	if ( typeof i18n.dict[ i18n.lang ][ what ] != "undefined" )
		return i18n.dict[ i18n.lang ][ what ];
	return what
}



