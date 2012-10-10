ANTA API
========

Anta provides a JSON api to allow you to build your own interface.

API function are _django views_ that output a JSON result.
A basic JSON call:

	http://127.0.0.1:8000/anta/api/?indent=true
Whom very basic _positive_ JSON response is:

	{
    	"status": "ok", 
   		"meta": {
        	"order_by": {}, 
        	"offset": 0, 
        	"next": {
            	"limit": 50, 
            	"offset": 50
        	}, 
        	"limit": 50, 
        	"filters": {}, 
        	"queries": null, 
        	"action": "index", 
        	"indent": true, 
        	"method": "GET"
    	}, 
    	"user": "daniele.guido"
	}

There are two types of api: the api which stick to the `Model` api and custom api.

They both make use of the syntax above to shape their response. THe `status` var can have only two values: `ok` or `ko`. When you receive a `ko` status, check for the `errorCode` and `error` values.
So, the `access-denied` view:

	http://127.0.0.1:8000/anta/api/access-denied/?indent=true

__always__ throws this output, because it is called internally as callback url:

	{
    	"status": "ko", 
    	"userMessage": "", 
    	"errorCode": "forbidden",
    	"user": "daniele.guido", 
   		"error": "access denied"
	}

Note that the `meta` json var is not always there.



### Common REQUEST params
---
Here below a table for those http params always accepted:
<table>
    <tr>
        <th>param name</th>
        <th>type</th>
        <th>default</th>
        <th>effect</th>
        <th>sample / choices</th>
    </tr>
    <tr>
        <td>indent</td>
        <td>boolean</td>
        <td>false</td>
        <td>	visually format json output: json.dumps( response, indent=4), cfr json.dumps doc</td>
        <td>	?indent&…</td>
    </tr>
</table>

### Model REQUEST params
---
<table>
    <tr>
        <th>param name</th>
        <th>type</th>
        <th>default</th>
        <th>effect</th>
        <th>sample / choices</th>
    </tr>
    <tr>
        <td>method</td>	
        <td>string</td>	
        <td>GET</td>
        <td>change funcion behaviour. e.g, POST create or update an element</td>
        <td>?method=[GET,DELETE,POST]&…</td>
    </tr>
    <tr>
        <td>limit</td>
        <td>integer</td>
        <td>50</td>
        <td>SQL LIMIT clause</td>
        <td>?limit=50…</td>
    </tr>
     <tr>
        <td>offset</td>
        <td>integer</td>
        <td>0</td>
        <td>SQL OFFSET CLAUSE, in conjunction with LIMIT</td>
        <td>?offset=50&limit=50…</td>
    </tr>
    <tr>
        <td>order_by</td>
        <td>json array</td>
        <td>	[]	</td>
        <td>The same value you usually employ in django [Model].objects.order_by() function, given as an args array.
Get a look at <b>core.utils._get_instances</b> function.	    </td>
        <td>?method=GET&order_by=["-creation_date"]…</td>

    </tr>
    
    <tr>
        <td>filters</td>
        <td>json object</td>
        <td>{}</td>
        <td>The same value you usually employ in django .objects.filters() function, given as an args array.
Get a look at core.utils._get_instances function. Note that the filters are join with AND operator. <!-- Use queries params to have an OR clause, since it needs django.db.models.Q function. -->	    </td>
        <td>?filters={‘user__id’:1035,’user__active’:false}</td>

    </tr>
</table>

Model API output __will differ__ according to the `method` used and the url pattern employed. That is, with a url of patttern `r'^api/documents/(\d+)/$'` you explicitely ask for a single document, identified by its primary key `(\d+)`.

On the other side, a variable free call `r'^api/documents/$'`  will return a list of Model `Document` objects. At present, you can't delete or update a list of instance, so method=DELETE and method=POST for pattern `r'^api/documents/$'` are disabled.


	http://127.0.0.1:8000/anta/api/corpus/2/?indent=true&method=GET

gives:

	{
    	"status": "ok", 
    	"meta": {
        	…
    	}, 
    	"user": "daniele.guido", 
    	"results": [
        	{
            	"id": 2, 
            	"name": "minimal"
        	}
    	]
	}

method=POST usually requires additional information, given as separate REQUEST params.

Details, function by function
-----------------------------

Each Paragraph descrbes in detail a url api-view function, in alphabetic order.
In some url you may have a {} couple. It contains the variable name.
Special functions are marked by a * sign. Of course, special functions have specials input / output… ALL functions requires authentified session COOKIES.

### segments_clean
---
Reset segment table for the specified corpus. Remove all Document_Segment instances related to corpus_id

Request:
    
    127.0.0.1:8000/anta/api/segments/clean/corpus/{corpus_id}/?indent=true
    
Listen for OK or KO response only. The corresponding `Routine` object will be available, even if it __is not updated__ with current value.

### segments_export
---
	r'^api/segments/export/corpus/(\d+)/$'
	
### segments_import
---
	r'^api/segments/import/corpus/(\d+)/$'

Please make sure that your request contains a input of type file named `csv[]`



### *segment_stems
---
Return a list of `Stem` object. Stem are not managed by Django (syncdb won't create any table for it), it's just a Model class to group Segment into group according to their "stemmed" value.

Corpus specific url pattern:
	
	
Retrieve all the stems stored:

	http://127.0.0.1:8000/anta/api/stems/?indent=true&order_by=["distribution DESC","max_tfidf DESC"]
	
accepted REQUEST params: `limit`, `offset`, `order_by`.

<!-- table>
    <tr>
        <th>param name</th>
        <th>type</th>
        <th>default</th>
        <th>effect</th>
        <th>sample / choices</th>
    </tr>
    <tr>
        <td>contains</td>
        <td>string</td>
        <td></td>
        <td>SQL clause WHERE … LIKE</td>
        <td>	?contains=ghost%&…</td>
    </tr>
</table -->	
	
### update_similarity
---
	r'^api/update-similarity/corpus/(\d+)/$',

Perform similarity computation between the documents belonging to the given corpus. 

This function does not employ tf/tfidf stored values but the cosine_similarity PATTERN implementation. 

Since PATTERN computate cosine similarity according to tf/tfidf values of shared words, we provide a _stemmed_ and unpunctuated representation of the document by simply joining segment stems with spaces.

This function is here just for documentation and completeness purpose. It is called automatically by `update_tfidf`, `tfidf` and `segments_import`.


--- to be continued ---