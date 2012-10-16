(function($) {

	$.fn.discontinue = {
		events:{
			'success.keepon.discontinue':'success.keepon.discontinue',
			'timeout.keepon.discontinue':'timeout.keepon.discontinue',
			'notmodified.keepon.discontinue':'notmodified.keepon.discontinue',
			'abort.keepon.discontinue':'abort.keepon.discontinue',
			'error.keepon.discontinue':'error.keepon.discontinue',
			'start.keepon.discontinue':'start.keepon.discontinue',
			'stop.keepon.discontinue':'stop.keepon.discontinue',
			'parsererror.keepon.discontinue':'parsererror.keepon.discontinue'
		},
		instances:{},
		vars:{},
		commands:{}
	};

	$.fn.discontinue.on = function( type, callback){
		
		$(window).on( type, callback);
	}

	$.fn.discontinue.unbind = function( type ){
		$(window).unbind( type );
	}

	$.fn.discontinue.trigger = function( type, data ){
		$(window).trigger( type, data);
	}

	/*
		usage:
			$().discontinue.verbose(); // listen to al "discontinue" events
			$().discontinue.keepon({url:"/url/to/bis", delay:2500}); repeat json ajax call to .
		Use listener to success.keepon.discontinue event to catch scuccess results. 
	\
	*/
	$.fn.discontinue.keepon = function(options) {
		var ajax = function(){
			$.fn.discontinue.trigger( $.fn.discontinue.events[ 'start.keepon.discontinue' ],{} ) ;
			$.ajax(settings);
		};

		var jam = function(){
			if( typeof $.fn.discontinue.commands.keepon_stop != "undefined" ){
				$.fn.discontinue.trigger( $.fn.discontinue.events[ 'stop.keepon.discontinue' ],{} ) ;
				return;
			}
			$.fn.discontinue.vars.keepon_cycle = typeof $.fn.discontinue.vars.keepon_cycle == "undefined"? 0: $.fn.discontinue.vars.keepon_cycle+1;
			clearTimeout( $.fn.discontinue.instances.keepon );
			$.fn.discontinue.instances.keepon = setTimeout( ajax, settings.delay );
		}

		if( typeof options == "string" ){
			console.log( "apply method" );
			if (options == "stop"){
				$.fn.discontinue.commands.keepon_stop = true;
			}
			return;
		}
		var settings = $.extend({
			delay: 1200,
			dataType: "json",
			url:"response.json",
			complete:function( result, textStatus ){ if (textStatus!="success" && textStatus!="error") {$.fn.discontinue.trigger( $.fn.discontinue.events[  textStatus + '.keepon.discontinue' ], result );}; jam() },
			success:function( result ){$.fn.discontinue.trigger( $.fn.discontinue.events[ 'success.keepon.discontinue' ], result ); },
			error:function( result, textStatus, errorThrown ){$.fn.discontinue.trigger( $.fn.discontinue.events[ 'error.keepon.discontinue' ], {jqXHR:result, textStatus:textStatus, errorThrown:errorThrown} ); },
			timeout:3000
		}, options);

		
		jam();
	};

	$.fn.discontinue.verbose = function( callback ){
		if ( typeof callback != "function"){
			callback = function( event, data){
				console.log( "[", event.namespace,"]", new Date(), event.type, data);
			}
		}
		for( var i in $.fn.discontinue.events ){
			$.fn.discontinue.on( $.fn.discontinue.events[i], callback);
		}

	};
	
	$.fn.discontinue.shutup = function(){
		for( var i in $.fn.discontinue.events ){
			$.fn.discontinue.unbind( $.fn.discontinue.events[i] );
		}
	}
	
})(jQuery);