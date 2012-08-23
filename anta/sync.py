import os, sys, re, mimetypes
from datetime import datetime

# get path of the django project
path = ("/").join( sys.path[0].split("/")[:-2] )

if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'sven.settings'

from django.conf import settings
from optparse import OptionParser
from sven.anta.models import *

def store_document( filename, corpus ):
	print
	print "[sync] corpus:", corpus.id, corpus.name
	print "[sync] filename:", filename
	

	basename = os.path.splitext(filename)[0]
	parts = os.path.basename(filename).split("_",3)
	print "[sync] basename:", basename
	
	# exclude .{ext}.txt from being taken
	if re.search( "\.[^\.]{3,4}\.[^\.]{3}$", filename ) is not None:
		print "[sync] skipping dual extension filenames.!", parts
		raise Exception("filename contains a double extension")
	
	# guess mimetype
	mime_type	=  mimetypes.guess_type( filename )[0]
	
	# guess date		
	date = re.search( r'(\d{8})', basename )
	
	if date is None:
		date = datetime.now()
	else:
		try:
			date	= datetime.strptime( date.group(), "%Y%m%d" ) 
		except:
			print "[sync] date format %s is not valid, substituted with datetime.now" % date.group()
			date	= datetime.now()
	
	# automatically include .txt files
	print "[sync] detecting mime type:", mime_type
	print "[sync] detecting date:", date.isoformat()
		
	
	# if options.autoformat
	# split by underscore (actor(s)[minus spaced], lang[EN|NL|FR], data[YYYYMMDD], title )
	# string sample: ACTOR1-ACTOR2_EN_20120131_A long and misty title about something
	#
	if len( parts ) == 4:
		print "[sync] file name seems to be valid:", parts
		
		actors		= parts[0].split("-")
		language	= parts[1]
		title		= parts[3].replace("_"," ")
	else:
		print "[WARNING] autoformat option is True but the file name does not handle enough information. Default applied"
		actors =[]
		language = 'EN'
		title = os.path.basename(filename) #os.path.splitext(filename)[0]
		
	print "[sync] saving file:", filename, mime_type
	print "[sync] file title:", title		
	print "[sync] file lang:", language
	print "[sync] file date:", date
	print "[info] actors found:",actors
	
	# save documents
	try:
		d = Document.objects.get( url=os.path.basename(filename), corpus=corpus )
		print "[sync] file already stored"

	except:
		# file do not exist, ty to uppload it
		d = Document( url=os.path.basename(filename), mime_type=mime_type, ref_date=date, corpus=corpus, status='IN', language=language, title=title )
		d.save()
		print "[sync] file added:", d.id
	
	# store actors as tags and attach with document_tags
	for a in actors:
		
		# create tag / retrieve aldready created one
		try:
			t = Tag.objects.get( name=a, type="actor" )
		except:
			t = Tag( name=a, type="actor" )
			t.save()
		
		try:
			dt = Document_Tag( document=d, tag=t )
			dt.save()
			
		except:
			print "[warning] document tag relationship exists."
			# continue
		#	"""
		#	SELECT d.language,d.title, t.name, t.type 
		#	FROM `anta_document_tag` dt  JOIN anta_document d ON dt.document_id = d.id 
		#	JOIN anta_tag t ON dt.tag_id = t.id 
		#	WHERE t.id = 13
		#	"""
		
	# register modification
	d.save()
		
	# parse documents
	return d
	pass

def cmdsync( options, parser ):
	# dir to sync
	path = settings.MEDIA_ROOT + options.corpus
	
	# list files
	print "[sync] corpus:",options.corpus
	print "[sync] corpsu path:", path
	print "[sync] path exists:", os.path.exists( path )
	print "[sync] disable autoformat:", options.noautoformat
	
	# save routine
	if not os.path.exists( path ):
		error( message="path created using corpus name does not exist!", parser=parser )
	
	# get or store corpus
	try:
		corpus = Corpus.objects.get( name=options.corpus )
	except:
		corpus = Corpus( name=options.corpus )
		corpus.save()
	
	# list document in corpus folder
	docs = os.listdir(path)
	
	for doc in docs:
		try:
			store_document( doc, corpus)
		except Exception, e:
			print e
			continue

		
		
			
def error( parser=None, message="generic error" ):
	print message
	if parser is not None:
		parser.print_help()
	exit(-1)

def main( argv):
	usage = "usage: %prog -c corpus_name -l lang"
	parser = OptionParser( usage=usage )
	parser.add_option(
		"-c", "--corpus", dest="corpus",
		help="write anta corpus_name to be sync. Every file under your MEDIA_ROOT/corpus_name folder will be recorded into the database if their name isn't already indexed")
	parser.add_option(
		"-l", "--lang", dest="language",
		default="EN",
		help="corpus language (char=2), e.g 'nl' or 'en', default 'en'. will be saved only for NEWLY added documents")
	
	parser.add_option(
		"-a", "--noautoformat", dest="noautoformat",
		help="if is set, disable automatic actors recognition in filename string")
	
	( options, argv ) = parser.parse_args()
	
	
	if options.corpus is None:
		error( message="Use -c to specify the corpus", parser=parser )
	
	if options.noautoformat is None:
		options.noautoformat = False
	else:
		options.noautoformat = True
		
	cmdsync(options, parser )




if __name__ == '__main__':
	# get corpus name
	main(sys.argv[1:])
