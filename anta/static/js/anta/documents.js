var anta = anta || { initialisables:[] };

anta.documents = {}
anta.documents.init = function(){
	anta.log("[anta.documents.init]");
	anta.api({url:anta.urls.get_documents, handler:'documents'});

	
	$(window).on(anta.events.selectionChanged, anta.magic.show_todays_specials );

	$(window).on(anta.events.selectionEmpty, anta.magic.hide_todays_specials );

	$(document).on("click",".item .remove", function(event){ 
		var type= $(event.currentTarget).attr("data-type");
		
		if( confirm( i18n.translate("remove %s",[]) ) ){
			anta.lock.enable({ clean:true });
			anta.toast( i18n.translate( "removing %s",[] ),{stayTime:1500,cleanup:true} )
		};
		event.stopImmediatePropagation();
	});

	$(document).on("click",".item", function(event){ 
		event.stopImmediatePropagation();
		
		var checkbox = $(event.currentTarget).find("input[type=checkbox]");
		if ( checkbox.attr("checked") ){
			checkbox.removeAttr("checked");
			$(event.currentTarget).removeClass("selected");
			$(window).trigger( anta.events.itemUnselected,{ id: checkbox.attr("data-id"), type:'documents'});
		} else {
			checkbox.attr("checked","checked");
			$(event.currentTarget).addClass("selected");
			$(window).trigger( anta.events.itemSelected,{ id: checkbox.attr("data-id"), type:'documents'});
		}
		console.log($(event.currentTarget).find("input[type=checkbox]"));});
}



anta.upload = { is_dragging:false }
/*
    plugin blueimp
*/
anta.upload.init = function(){


	anta.log("[anta.upload.init]", anta.width, anta.height);
	$("#fileupload").fileupload({
		url: anta.urls.upload,
		dataType: 'json',
		done: function(e, data){
			anta.log("[fileupload] status:", data.result.status);
			if (data.result.status =="ko"){
				anta.toast( i18n.translate( data.result.error ), i18n.translate("error"),{stayTime:1500,cleanup:true} )
			}
		},
		fail: function( e, data ){
			anta.log("failed!", data.error);
		},
		progressall: function(e, data){
			var progress = parseInt(data.loaded / data.total * 100, 10);
			// anta.log("progress:",progress)
			if( data.loaded == data.total ){
				anta.lock.disable();
			}
			$("#percentage").text(progress + " %"); 
		},
		dragover: function(e,data){

			if( anta.upload.is_dragging ) return;

			anta.upload.is_dragging = true;
			
			anta.log("[anta.upload.dragover] started...");
		},
		drop: function( e, data){
			anta.lock.enable();
			anta.upload.is_dragging = false;
			anta.log("[anta.upload.always] something happened...");
		}
	})
}
