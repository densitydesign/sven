ANTA 
====

tfidf computation process + similarity
--------------------------------------

1. fill media/corpus_name 

2. use appropriate filenames while uploading. Format accepted 

        ACTOR1-ACTOR2_LANGUAGE_YYYYMMDD_TITLE SPCE SEPARATED.EXT 
        
    where language is a two chars attribute, like 'EN' or 'NL', e.g:
    
        EU-USA-UK_EN_20080518_The Mysterious Island.pdf
        

3. use sync script to sync the database with the media space 
 
        ~/sven/anta/$ python sync -c corpus_name

4. use ampoule script to extract summarization 
 
        ~/sven/anta/$ python ampoule.py -c corpus_name

5. use metrics.py to manage tfidf computation (specify corpus AND language) 

        ~/sven/anta/$ python metrics.py -c corpus_name -f tfidf -l EN

6. use metrics.py to manage similarity between documents, using cosine similarity (change function ) 

        ~/sven/anta/$ python metrics.py -c corpus_name -f similarity -l EN

useful sql queries 
------------------

How to get **actor / number of document per actor** 
(actor is a tag.name). Note that this does not handle overlapping
(i.e. documents are "duplicated"). 
Overlapping: get document by tag

    SELECT 
        count( DISTINCT d.id) as num_of_document, 
        t.name, 
        t.type 
    FROM `anta_document_tag` dt  
    JOIN anta_document d ON dt.document_id = d.id 
    JOIN anta_tag t ON dt.tag_id = t.id 
        WHERE t.type="actor" 
    GROUP BY name

How to get a **cosine similarity** table between documents 

    SELECT 
        d1.id as alpha_id, d1.title as alpha_title, d1.language as alpha_language,
        d2.id as omega_id, d2.title as omega_title, d2.language as omega_language,
        y.cosine_similarity 
    FROM `anta_distance` y 
    JOIN anta_document d1 ON y.alpha_id = d1.id 
    JOIN anta_document d2 on y.omega_id = d2.id 
    ORDER BY y.`cosine_similarity`  DESC