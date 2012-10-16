/*
	                           
	                O          
	               oOo         
	.oOoO` `OoOo.   o   .oOoO 
	O   o   o   O   O   O   o  
	o   O   O   o   o   o   O  
	`OoO`o  o   O   `oO `OoO'o 
                         
    Angular controllers

*/
var anta = anta || {};
anta.f = anta.f || {};
anta.f.getCookie = function(name){var cookieValue=null;if(document.cookie&&document.cookie!=''){var cookies=document.cookie.split(';');for(var i=0;i<cookies.length;i++){var cookie=jQuery.trim(cookies[i]);if(cookie.substring(0,name.length+1)==(name+'=')){cookieValue=decodeURIComponent(cookie.substring(name.length+1));break}}}return cookieValue};
anta.f.sameOrigin = function(url){var host=document.location.host;var protocol=document.location.protocol;var sr_origin='//'+host;var origin=protocol+sr_origin;return(url==origin||url.slice(0,origin.length+1)==origin+'/')||(url==sr_origin||url.slice(0,sr_origin.length+1)==sr_origin+'/')||!(/^(\/\/|http:|https:).*/.test(url))}
anta.f.safeMethod = function(method){return(/^(GET|HEAD|OPTIONS|TRACE)$/.test(method))}


anta.configs = anta.configs || {};
anta.configs.http = {
	csfr: anta.f.getCookie('csrftoken')//(!anta.f.safeMethod(settings.type) && anta.f.sameOrigin(settings.url))? anta.f.getCookie('csrftoken'):''
}

anta.controllers = {}
anta.controllers.get = function( $http, url, params, configs){
	params = typeof params != "object"?{}:params;
	configs = typeof configs != "object"?{}:configs;
	return  $http.get( url, params, {headers:{"X-CSRFToken":anta.configs.http.csfr}} );
}

function CorpusController( $scope, $http ) {
	anta.controllers.get( $http, anta.urls.get_corpora ).success(function(result){
		console.log( "CorpusController",result );
		$scope.objects = result.results
	});
}

function DocumentController( $scope, $http ) {
	anta.controllers.get( $http, anta.urls.get_documents ).success(function(result){
		console.log( "DocumentController", result );
		$scope.objects = result.results
	});
}