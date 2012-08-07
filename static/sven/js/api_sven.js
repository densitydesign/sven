var svenjs = svenjs || {};

//TODO: use a more robust pattern for object creation
svenjs.Sven = function(url){

    this.url = url;
    return this;

};

/* query function */
svenjs.Sven.prototype.query = function(successCallback){

    //var url = this.url + "/sketch/query/" + this.database + "/" + collection + "/" + command + "/";
    var url = this.url + "/anta/api/get-documents/corpus/test/?indent";
    console.log("query", url);
    
    $.ajax({
        type: 'GET',
        url: url,
        success: successCallback,
        dataType: 'json'
    });
    
    
};

