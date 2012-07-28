import os,sys,mimetypes, math
from datetime import datetime

# get path of the django project
path = ("/").join( sys.path[0].split("/")[:-2] )

if path not in sys.path:
    sys.path.append(path)
    
os.environ['DJANGO_SETTINGS_MODULE'] = 'sven.settings'

from django.conf import settings
from optparse import OptionParser
from sven.anta.models import *
from sven.anta.sync import error
from sven.anta.log import log
from sven.anta.distiller import distill
from sven.anta.utils import *
from sven.core.utils import dictfetchall
from django.db.models import Count, Avg, Max, Min
from django.db import connection, transaction
from pattern.vector import Document as pvDocument, Corpus as pvCorpus

"""
select all stemmed list

SELECT d.id as doc_id, d.language as doc_lang, d.title as doc_title, s.content, s.stemmed as lemmas, ds.tfidf, ds.tf FROM `anta_document_segment` ds JOIN anta_segment s ON s.id = ds.segment_id JOIN anta_document d on d.id = document_id WHERE d.language='EN' ORDER BY `ds`.`tfidf` DESC, lemmas ASC

[document.language]

group by stem


select all with group by stem

SELECT s.content as sample_content, GROUP_CONCAT(s.content) as concat_content, s.stemmed as lemmas, ds.tfidf, MAX( ds.tf ) as max_tf, COUNT( DISTINCT d.id ) as distribution, d.language as doc_lang FROM `anta_document_segment` ds JOIN anta_segment s ON s.id = ds.segment_id JOIN anta_document d on d.id = document_id WHERE d.language='EN' GROUP BY stemmed ORDER BY `ds`.`tfidf` DESC, max_tf DESC
"""


def tfidf( corpus, language, parser, column="stemmed" ):
	print """
	===========================
	---- TFIDF COMPUTATION ----
	===========================
	"""
	print "column:",column
	
	
	try:
		# get corpus
		corpus = Corpus.objects.get( name=corpus )
	except:
		return error( message="corpus was not found!", parser=parser )
	
	print "corpus:",corpus.id, corpus.name
	
	number_of_documents = Document.objects.filter(corpus=corpus ).count()
	print "document in corpus:",number_of_documents
	
	
	cursor = connection.cursor()
	
	cursor.execute("SELECT COUNT( DISTINCT ds.document_id ) as distribution, s." + column + " FROM `anta_document_segment` ds JOIN anta_segment s ON ds.segment_id = s.id JOIN anta_document d ON d.id = ds.document_id WHERE d.corpus_id = %s GROUP BY s."+column+" ORDER BY distribution DESC, "+ column +" ASC", [ corpus.id])
    
	for row in dictfetchall(cursor):
		
		print row[ column ], row['distribution']
		kwargs = {
    		'{0}__{1}'.format('document', 'corpus'): corpus,
			'{0}__{1}'.format('segment', column ): row[ column ],
		}
		ds = Document_Segment.objects.filter( **kwargs ).all().order_by('-tf')
		
		df = float( row['distribution'] ) / number_of_documents
		# computate tf idf for the given value
		first = True
		
		for s in ds:
			# computate and store tfidf
			s.tfidf = s.tf * math.log(1/df) 
			s.save()
			
			if first:
				print "sample tfidf for '",row[ column ], '{', row['distribution'],"}': tf[",s.tf,"] df[", df, "] idf[",math.log(1/df),"] tfidf[", s.tfidf,"]"
				first = False
	# cycle thouhg segments
	
	print corpus.name, number_of_documents


def export( corpus, language, parser, column="stemmed" ):
	print """
	===========================================
	---- EXPORT SEGMENTS FOR REFINE SAMPLE ----
	===========================================
	"""
	try:
		c = Corpus.objects.get( name=corpus )
	except Exception, e:
		print "Exception: %s" % e
		return error( message="corpus '%s' was not found!" % corpus, parser=parser )
	
	ss = Segment.objects.raw("""
		SELECT 
			`anta_segment`.`id`, `anta_segment`.`content`, `anta_segment`.`language`, 
			`anta_segment`.`stemmed`, `anta_segment`.`status`, 
			MAX(`anta_document_segment`.`tfidf`) AS `max_tfidf`,
			MAX(`anta_document_segment`.`tf`) AS `max_tf`, 
			COUNT(`anta_document_segment`.`document_id`) AS `distro` 
		FROM `anta_segment`
			JOIN `anta_document_segment` ON (`anta_segment`.`id` = `anta_document_segment`.`segment_id`) 
			JOIN `anta_document` ON (`anta_document_segment`.`document_id` = `anta_document`.`id`) 
		WHERE `anta_document`.`corpus_id` = %s AND content NOT REGEXP '^[[:alpha:]][[:punct:]]$'
		GROUP BY `anta_segment`.`id`
		""",[c.id]
	) 
	
	print ss.query	

	for s in ss:
		print s.id, s.stemmed, s.distro, s.max_tfidf, s.max_tf
		break

def similarity( corpus, language, parser, column="stemmed" ):
	print """
	====================
	---- SIMILARITY ----
	====================
	"""
	
	try:
		corpus = Corpus.objects.get( name=corpus )
	except:
		return error( message="corpus '%s' was not found!" % corpus, parser=parser )
	
	print "corpus:",corpus.id, corpus.name
	
	number_of_documents = Document.objects.filter(corpus=corpus ).count()
	print "document in corpus:",number_of_documents
	
	# get stemmed list per document
	cursor = connection.cursor()
	cursor.execute("SELECT " + column + ", d.id as doc_id FROM anta_document_segment ds  JOIN anta_segment s ON ds.segment_id = s.id JOIN anta_document d ON ds.document_id = d.id WHERE d.corpus_id=%s",[ corpus.id ] ) # we do not need ORDER BY d.id, ds.id
	
	# build corpus 
	documents = {}
	
	for row in dictfetchall(cursor):
		if row['doc_id'] not in documents:
			documents[ row['doc_id'] ] = []
		documents[ row['doc_id'] ].append( row[ column ] )	
		
	# translate corpus id
	pattern_id_translation = {}
	
	# reformat documents, join space separated stemmed segment values.
	for d in documents:
		documents[d] = pvDocument( " ".join( documents[d] ) )
		pattern_id_translation[ documents[d].id ] = d
		
	print "pattern_id_translation table:", pattern_id_translation
	print "document in corpus:",number_of_documents
	print "similarity neighborood ",number_of_documents / 2
	
	# store document in corpus.
	c = pvCorpus( documents.values() )
	
	# computate and save similarities
	for d in documents:
		for n in c.neighbors( documents[d], top=number_of_documents):
			alpha_id = pattern_id_translation[ documents[d].id ]
			omega_id = pattern_id_translation[ n[1].id ]
			cosine_similarity = n[0]
			
			try:
				dist = Distance.objects.get( alpha__id=alpha_id, omega__id=omega_id )
				print "distantce exists:", dist.id, cosine_similarity
			except:
				dist = Distance( alpha_id=alpha_id, omega_id=omega_id )
				print "create Distance object", dist.id, cosine_similarity
			#	print a distance exist between these two document	
			dist.cosine_similarity = cosine_similarity
			dist.save()
			# print documents[d].id, alpha_id,omega_id
		
	return
	
def main( argv):
	usage = "usage: %prog -c corpus_name -l language -f function [tfidf|similarity|export [-o column]]"
	parser = OptionParser( usage=usage )
	parser.add_option("-c", "--corpus", dest="corpus",
		help="anta corpus_name to be metricsied. Computate tfidf")
		
	parser.add_option( "-l", "--language", dest="language", default="en",
		help="language")
	
	parser.add_option("-f", "--function", dest="func",
		help="function")
	
	parser.add_option( "-o", "--tfidfcolumn", dest="tfidfcolumn", default="stemmed",
		help="function")
	
	( options, argv ) = parser.parse_args()
	
	if options.corpus is None:
		error( message="Use -c to specify the corpus", parser=parser )
	
	if options.language is None:
		error( message="Use -l to specify the language", parser=parser )
	
	if options.func is None:
		error( message="Use -f to specify the desired function.", parser=parser )
	
	if options.func == "tfidf":	
		tfidf(options.corpus, options.language, parser, options.tfidfcolumn )
	
	elif options.func == "similarity":
		similarity(options.corpus, options.language, parser, options.tfidfcolumn )

	elif options.func == "export":
		export( options.corpus, options.language, parser, options.tfidfcolumn)
		
	else:
		error( message="sorry, the desired function was not found!", parser=parser )
	
	
if __name__ == '__main__':
	# get corpus name
	main(sys.argv[1:])	
