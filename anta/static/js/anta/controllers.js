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



function CorpusController( $scope, $http ) {

	$http.get( anta.urls.get_documents, {method:'GET'}, {headers:{"X-CSRFToken":anta.configs.http.csfr}}).success(function(result){
		console.log( result );
		$scope.objects = result.results
	});
}