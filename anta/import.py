import os,sys,csv
from datetime import datetime

path = ("/").join( sys.path[0].split("/")[:-2] )

if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'sven.settings'

from optparse import OptionParser
from sven.anta.models import *
from sven.anta.sync import error
# import segments refined
# Import a csv file refined
# Every segment must hava an id
#
def segments( options, parser ):
	print """
	=========================
	---- IMPORT SEGMENTS ----
	=========================	
	"""
	try:
		corpus = Corpus.objects.get( name=options.corpus )
	except:
		return error( message="corpus was not found! use sync.py script to load corpora", parser=parser )
	print "corpus:",corpus
	
	if not os.path.exists( options.csv ):
		error( message="csv file was not found.", parser=parser )
	f = open( options.csv, 'rb' )
	c = csv.DictReader( f, delimiter=options.delimiter )
	
	print "filename:",options.csv
	for row in c:
		print row
		# update stemmed_refined cell
		try:
			s = Segment.objects.get(id=row['segment_id'])
			print s.id, s.content
		except:
			print	" segemnt id %s was not found!" % row['segment_id']
			continue
		
		# buffer_stemmed = s.stemmed
		s.stemmed_refined = row['stemmed']
		# s.stemmed
		s.save()
		break

def main( argv):
	parser = OptionParser( usage="usage: %prog -f csv -c corpus_name [-d delimiter]" )
	parser.add_option( "-c", "--corpus", dest="corpus",
		help="anta corpus_name")
	
	parser.add_option( "-f", "--csv", dest="csv",
		help="csv file to be parsed")
	
	parser.add_option( "-d", "--delimiter", dest="delimiter", default="\t",
		help="csv separator")
	
	( options, argv ) = parser.parse_args()
	
	if options.corpus is None:
		return error( message="Use -c to specify the corpus", parser=parser )
	
	if options.csv is None:
		return error( message="Use -f to specify the csv file path", parser=parser )
	
	return segments(options, parser)	
	
	

if __name__ == '__main__':
	# get corpus name
	main(sys.argv[1:])
