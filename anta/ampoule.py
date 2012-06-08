import os,sys,mimetypes
from datetime import datetime
from warnings import filterwarnings
import MySQLdb as Database

filterwarnings('ignore', category = Database.Warning)

# get path of the django project
path = ("/").join( sys.path[0].split("/")[:-2] )

if path not in sys.path:
    sys.path.append(path)
    
os.environ['DJANGO_SETTINGS_MODULE'] = 'sven.settings'
from sets import Set
from django.conf import settings
from optparse import OptionParser
from sven.anta.models import *
from sven.anta.sync import error
from sven.anta.log import log
from sven.anta.distiller import distill
from sven.anta.utils import *

#
# ampoule
# =======
# 
# foreach documents
#    extract with distill tags and NP
#       attach tags to document (automatic pseudotagging)
#    save every NP found along with specifid tf (term frequency )
# once finished
#    recalculate tf/idf foreach tf
#
def decant( options, parser ):
	# path = settings.MEDIA_ROOT + options.corpus
	# print NL_STOPWORDS
	
	# get corpus
	# get or store corpus
	try:
		corpus = Corpus.objects.get( name=options.corpus )
	except:
		
		return error( message="corpus was not found!", parser=parser )
	# get document corpus
	print corpus.name

	documents = Document.objects.filter(corpus=corpus.id, status="IN").all()
	for d in documents:
		print
		print " document ",d.id
		print " ---------------------------------------"
		print
		
		# a = Analysis( document=d, )
		
		textified =  textify( d, settings.MEDIA_ROOT )
		
		if textified == False:
			print "[error] while textify file ",d.id, d.title
			continue
		
		textified = textified.replace("%20"," ")
		
		# load storpwords for document d language
		if d.language == "NL": 
			stopwords = NL_STOPWORDS
		else:
			stopwords = EN_STOPWORDS
		
		print "[info] document language:",d.language
		print "[info] analysis started on doc ", d.id,"'", d.title,"'", d.language.lower(), "file:",textified
		
		#start distill anaysis, exclude given stopwors
		distilled = distill( filename=textified, language=d.language.lower(), stopwords=stopwords )
		
		# append keywords as tag for the document
		for k in distilled['keywords']:
			# print k
			candidate = k[1]
			# get tag
			try:
				t = Tag.objects.get( name=candidate, type="keyword" )
			except:
				# todo lemma version of a word according to language
				t = Tag( name=candidate, type="keyword" )
				t.save()
		 	
		 	# set tag documnt relation
		 	try:
		 		td = Document_Tag( document=d, tag=t)	
		 		td.save()
		 	except:
		 		#relation exist,
		 		continue
		
		# segment
		first = True
		for segment in distilled['segments']:
			if len(segment[0]) > 128:
				print "[warning] sample 'segment' will be truncated:", segment[0]
				continue
			try:
				s = Segment.objects.get( content=segment[0][:128], language=d.language)
			except:
				s = Segment( content=segment[0][:128], stemmed="-".join(segment[1])[:128], language=d.language )
				s.save()
			
			try:
				sd = Document_Segment.objects.get( document=d, segment=s )
			except:
				sd = Document_Segment( document=d, segment=s, tf=segment[2] )
				sd.save()
				# relationship exist
			if first:
				print "[info] sample 'segment' saved:", s.id, s.content, ", stem:", s.stemmed ,", tf:", sd.tf
				
			
			# save concept and attach
			for k in segment[1]:
				try:
					c = Concept.objects.get( content=k, language=d.language)
				except:
					c = Concept( content=k, language=d.language )
					c.save()
				try:
					sc = Segment_Concept.objects.get( segment=s, concept=c )
				except:
					sc = Segment_Concept( segment=s, concept=c )
					sc.save()	
					
				if first:
					print "[info] sample 'concept' saved:",c.id, c.content

			first = False
			
		
		
		print "[info] analysis ended on doc", d.id,"'", d.title,"'"
		
		
def main( argv):
	usage = "usage: %prog -c corpus_name"
	parser = OptionParser( usage=usage )
	parser.add_option(
		"-c", "--corpus", dest="corpus",
		help="anta corpus_name to be distilled. Computate tf and then tf-idf")
	( options, argv ) = parser.parse_args()
	
	if options.corpus is None:
		error( message="Use -c to specify the corpus", parser=parser )
	
		
	decant(options, parser )
	
	
if __name__ == '__main__':
	# get corpus name
	main(sys.argv[1:])