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
from django.db.models import Count


"""
select all stemmed list

SELECT d.id as doc_id, d.language as doc_lang, d.title as doc_title, s.content, s.stemmed as lemmas, ds.tfidf, ds.tf FROM `anta_document_segment` ds JOIN anta_segment s ON s.id = ds.segment_id JOIN anta_document d on d.id = document_id WHERE d.language='EN' ORDER BY `ds`.`tfidf` DESC, lemmas ASC

[document.language]

group by stem


select all with group by stem

SELECT s.content as sample_content, GROUP_CONCAT(s.content) as concat_content, s.stemmed as lemmas, ds.tfidf, MAX( ds.tf ) as max_tf, COUNT( DISTINCT d.id ) as distribution, d.language as doc_lang FROM `anta_document_segment` ds JOIN anta_segment s ON s.id = ds.segment_id JOIN anta_document d on d.id = document_id WHERE d.language='EN' GROUP BY stemmed ORDER BY `ds`.`tfidf` DESC, max_tf DESC
"""


def tfidf( corpus, language, parser ):
	"""
	
	"""
	try:
		corpus = Corpus.objects.get( name=corpus )
	except:
		
		return error( message="corpus was not found!", parser=parser )
	# get document corpus
	
	number_of_documents = Document.objects.filter(corpus=corpus,language=language.upper()).count()
	
	from django.db import connection, transaction
	cursor = connection.cursor()
	
	cursor.execute("SELECT COUNT( DISTINCT ds.document_id ) as distribution, s.stemmed FROM `anta_document_segment` ds JOIN anta_segment s ON ds.segment_id = s.id JOIN anta_document d ON d.id = ds.document_id WHERE s.language=%s AND d.corpus_id = %s GROUP BY s.stemmed ORDER BY distribution DESC, stemmed ASC", [ language.upper(), corpus.id])
    
	for row in dictfetchall(cursor):
		
		print row['stemmed'], row['distribution']
		ds = Document_Segment.objects.filter(segment__stemmed=row['stemmed'], document__corpus=corpus, document__language=language.upper()).all().order_by('-tf')
		
		df = float( row['distribution'] ) / number_of_documents
		# computate tf idf for the given value
		first = True
		
		for s in ds:
			# computate and store tfidf
			s.tfidf = s.tf * math.log(1/df) 
			s.save()
			
			if first:
				print "[info] sample tfidf for '",row['stemmed'], '{', row['distribution'],"}': tf[",s.tf,"] df[", df, "] idf[",math.log(1/df),"] tfidf[", s.tfidf,"]"
				first = False
	# cycle thouhg segments
	
	print corpus.name, number_of_documents
	

def similarity( corpus, language ):
	return
	
def main( argv):
	usage = "usage: %prog -c corpus_name -l language"
	parser = OptionParser( usage=usage )
	parser.add_option(
		"-c", "--corpus", dest="corpus",
		help="anta corpus_name to be metricsied. Computate tfidf")
	parser.add_option(
		"-l", "--language", dest="language",
		help="language")
	
	( options, argv ) = parser.parse_args()
	
	if options.corpus is None:
		error( message="Use -c to specify the corpus", parser=parser )
	
	if options.language is None:
		error( message="Use -l to specify the language", parser=parser )
	
		
	tfidf(options.corpus, options.language, parser )
	
	
if __name__ == '__main__':
	# get corpus name
	main(sys.argv[1:])	