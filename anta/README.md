ANTA 
====

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