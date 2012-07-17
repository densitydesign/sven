var svenjs = svenjs || {};

//TODO: use a more robust pattern for object creation
svenjs.Sven = function(url){

    this.url = url;
    return this;

};

/* query function */
svenjs.Sven.prototype.query = function(successCallback){

    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/documents/?indent";
    console.log("query", url);
    
    $.ajax({
        type: 'GET',
        url: url,
        success: successCallback,
        dataType: 'json'
    });
    
    
};

/* get documents */
svenjs.Sven.prototype.documents = function(id, filters, fields, successCallback){

    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/documents/?indent";
    //console.log("query", url);
    
    $.ajax({
        type: 'GET',
        url: url,
        success: successCallback,
        dataType: 'json'
    });
    
    
};

/* get documents */
svenjs.Sven.prototype.getDocuments = function(successCallback, args){
	
	if (args){
		var limit = (args.limit == undefined)  ? null : args.limit;
		var offset = (args.offset == undefined) ? null : args.offset;
	//var filter = args.filter || null; //not yet implemented
	//var fields = args.fields || null; //not yet implemented
		}
	
    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/documents/?indent";
    
	if (limit != null){ url = url + "&limit=" + limit};
	if (offset != null){ url = url + "&offset=" + offset};
	
    console.log("query", url);
    
    $.ajax({
        type: 'GET',
        url: url,
        success: successCallback,
        dataType: 'json'
    });
    
    
};

/* get document */
svenjs.Sven.prototype.getDocument = function(id, successCallback, args){
	
	if (args){
		var fields = (args.fields == undefined)  ? null : args.fields;
		}
		
    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/documents/" + id + "/" + "?indent";
    console.log("query", url);
    if (fields != null){
    	//to implement
    	};
    
    $.ajax({
        type: 'GET',
        url: url,
        success: successCallback,
        dataType: 'json'
    });
    
    
};

