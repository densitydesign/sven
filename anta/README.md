
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