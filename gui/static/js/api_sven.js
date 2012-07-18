var svenjs = svenjs || {};

//TODO: use a more robust pattern for object creation
svenjs.Sven = function(url){

    this.url = url;
    return this;

};




/* get documents */
svenjs.Sven.prototype.getDocuments = function(successCallback, args){
	
    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/documents/?indent=true";
	
    
    $.ajax({
        type: 'GET',
        url: url,
        data: args,
        complete: function(){
        	console.log(this.url);
    		},
        success: successCallback,
        error: successCallback,
        dataType: 'json'
    });

};

/* get document */
svenjs.Sven.prototype.getDocument = function(id, successCallback, args){

		
    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/documents/" + id + "/" + "?indent=true";

    $.ajax({
        type: 'GET',
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

/* get relations */
svenjs.Sven.prototype.getRelations = function(successCallback, args){
	
    var url = this.url + "/anta/api/relations/?indent=true";
	
    
    $.ajax({
        type: 'GET',
        url: url,
        data: args,
        complete: function(){
        	console.log(this.url);
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

    $.ajax({
        type: 'GET',
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

/* add relation */
svenjs.Sven.prototype.addRelation = function(successCallback, args){
	
    var url = this.url + "/anta/api/relations/?method=POST&indent=true";
	
    
    $.ajax({
        type: 'GET',
        url: url,
        data: args,
        complete: function(){
        	console.log(this.url);
    		},
        success: successCallback,
        error: successCallback,
        dataType: 'json'
    });

};

/* delete relation */
svenjs.Sven.prototype.deleteRelation = function(id, successCallback){
	
    var url = this.url + "/anta/api/relations/" + id + "/" + "?method=DELETE&indent=true";
	
    
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