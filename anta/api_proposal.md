#### Sven API (App)

#####Corpus

######Get

All corpus
	
	api.sven.com/v1/corpus/
	
Limit and offset

	api.sven.com/v1/corpus/?limit=20&offset=0

Filters

	api.sven.com/v1/corpus/?filters={name:'corpus name'}


Single corpus

	api.sven.com/v1/corpus/<id>
	
Fields

*No fields yet*

######Post

Corups

	api.sven.com/v1/corpus/?param={name:'corpus name'}&method=post

######Put

Corpus

	api.sven.com/v1/corpus/<id>/?name='new name'&method=put

######Delete
Corpus

	api.sven.com/v1/corpus/<id>/?method=delete


***

#####Documents

######Get

All documents
	
	api.sven.com/v1/documents/
	
	
Limit and offset

	api.sven.com/v1/documents/?limit=20&offset=0

Filters

	api.sven.com/v1/documents?filters={'actors':'id',startDate:2010-4-10,endDate:2011-01-01, corpus:'corpus name'}


Single document

	api.sven.com/v1/documents/<id>
	
Fields

	api.sven.com/v1/documents/<id>/?fields=[title,tags]

######Post

Document

	api.sven.com/v1/documents/?param={url:'path/to/document', corpus:'corpus name'}&method=post

*Not sure now…*

######Put

Document

	api.sven.com/v1/documents/<id>/?name='new name'&method=put

*Other properties won't be editable now (tags, actors, ecc)*

######Delete
Document

	api.sven.com/v1/documents/<id>/?method=delete


***

#####Actors
######Get

All actors
	
	api.sven.com/v1/actors/
	
Limit and offset

	api.sven.com/v1/actors/?limit=20&offset=0

Filters

*Nothing to be filetered now*

Single actor

	api.sven.com/v1/actors/<id>
	
Fields

*No fields yet*

######Post

Actor

	api.sven.com/v1/actors/?param={name:'actor name'}&method=post

######Put
Actor
	
	api.sven.com/v1/actors/<id>/?name='new name'&method=put


######Delete
Actor

	api.sven.com/v1/actors/<id>/?method=delete

***

#####Tags
######Get

All tags
	
	api.sven.com/v1/tags/
	
Limit and offset

	api.sven.com/v1/tags/?limit=20&offset=0

Filters

*Nothing to be filetered now*

Single tag

	api.sven.com/v1/tags/<id>
	
Fields

*No fields yet*

######Post

Tag

	api.sven.com/v1/tags/?param={name:'tag name', relevance:0.7}&method=post

######Put
Tag
	
	api.sven.com/v1/tags/<id>/?name='new name'&method=put


######Delete
Tag

	api.sven.com/v1/tags/<id>/?method=delete

***

#####Relations

######Get

All relations
	
	api.sven.com/v1/relations/
	
Limit and offset

	api.sven.com/v1/relations/?limit=20&offset=0

Filters

	api.sven.com/v1/relations/?filters={'target':'id','description':'text to search in description'}
	
Single relation

	api.sven.com/v1/relations/<id>
	
Fields

	api.sven.com/v1/relations/<id>/?fields=[description]

######Post

Relation

	api.sven.com/v1/relations/?param={target:'target id', source:'source id', description:'text', polarity:0.7}&method=post

######Put
Relation
	
	api.sven.com/v1/relations/<id>/?description='new description'&method=put


######Delete
Relation

	api.sven.com/v1/relations/<id>/?method=delete


***

#### API response

query: 
	
	api.sven.com/v1/documents/

response:

	{
    "status": "ok", 
    "meta": {
        "limit": 20, 
        "offset": 0,
        "total": 2,
        "query": "api.sven.com/v1/documents/",
        "next":"api.sven.com/v1/documents/?limit=20&offset=20",
        "user": "admin"
    }, 
    "results": [
        {
            "date": "2011-01-01T00:00:00",
            "id": 1, 
            "mime_type": "application/pdf", 
            "title": "eco-efficient ondernemen de moeite waard" ,
            "language":"NL",
            "tags": [
                {
                    "id": 1, 
                    "name": "AO"
                }, 
                {
                    "id": 15, 
                    "name": "ondernemen"
                }, 
                {
                    "id": 16, 
                    "name": "agentschap"
                }, 
                {
                    "id": 17, 
                    "name": "scan"
                }
            ] 
        },
		{
            "date": "2008-01-01T00:00:00",
            "id": 2, 
            "mime_type": "application/pdf", 
            "title": "cleantechplatform",
            "language":"EN",
            "tags": [
				{
                    "id": 2, 
                    "name": "Cleantechplatform"
                }, 
                {
                    "id": 18, 
                    "name": "bedrijf"
                }, 
                {
                    "id": 35, 
                    "name": "bedrijven"
                }, 
                {
                    "id": 36, 
                    "name": "cleantech"
                }, 
                {
                    "id": 37, 
                    "name": "limburg"
                }
            ],
            "relations": [
            		{
                    	"id": 4, 
                    	"source": 2,
                    	"target": 5,
                    	"polarity":0.7
                    	"description":"text"
                	} 
            
            ]
        }
       ]
      }

error response sample:

	{
	"status": "Bad Request",
	"developerMessage" : "Verbose, plain language description of the problem for the app developer with hints about how to fix it.", 
	"userMessage":"Pass this message on to the app user if needed.",
	"errorCode" : 12345, 
	"more info": "http://dev.sven.com/errors/12345"}
	
***

#### API workflow

#####Documents list view

1. All documents:
```
api.sven.com/v1/documents/
```
2. Filter by one actor:
```
api.sven.com/v1/documents/?filters={'actors':'id'}
```
3. Filter by multiple actors:
```
api.sven.com/v1/documents/?filters={'actors':['id1','id2','id3']}
```
4. Limit and offset option for infinite scroll:
```
api.sven.com/v1/documents/?limit=20&offset=20
```
5. Upload document:
```
api.sven.com/v1/documents/?param={url:'path/to/document', corpus:'corpus name'}&method=post
```
6. Delete document:
```
api.sven.com/v1/documents/<id>?method=delete
```

##### Single Document view

1. Document information:
```
api.sven.com/v1/documents/<id>
```
2. Update title:
```
api.sven.com/v1/documents/<id>?title='new title'&method=put
```
5. Add relation:
```
api.sven.com/v1/relations/?params={description:'description text', target:'id', source:'id'}&method=post
```
6. Update relation
```
api.sven.com/v1/relations/<id>/?description='description text'&method=put
```
7. Delete relation
```
api.sven.com/v1/relations/<id>/?method=delete
```

##### Timeline view
1. All documents:
```
api.sven.com/v1/documents/
```
2. Filters (actor,time,ecc):
```
api.sven.com/v1/documents/?filters={'actors':'id',startDate:2010-4-10,endDate:2011-01-01}
```

##### Dynamics view
1. All documents:
```
api.sven.com/v1/documents/?structure=graph
```
2. Filters (actor,time,ecc):
```
api.sven.com/v1/documents/?filters={'actors':'id',startDate:2010-4-10,endDate:2011-01-01}&structure=graph
```
