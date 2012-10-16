/*
	                           
	                O          
	               oOo         
	.oOoO' 'OoOo.   o   .oOoO' 
	O   o   o   O   O   O   o  
	o   O   O   o   o   o   O  
	`OoO'o  o   O   `oO `OoO'o 
                         
    Angular Services.js
*/

/*

	Model.Corpus GET and POST
	
*/
angular.module('corpusServices', ['ngResource']).factory( 'Corpus', function( $resource ){
	return $resource(
		'phones/:phoneId.json', 
		{}, 
		{ query: { method:'GET', params:{ phoneId:'phones' }, isArray:true } }
	);
});