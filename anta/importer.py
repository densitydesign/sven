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


#
#    =======================
#    ---- TAGS FROM CSV ----
#    =======================
#

def tagsfromcsv( options, parser ):
	print 
	print tagsfromcsv
	

#
#    ===================
#    ---- MAIN FLOW ----
#    ===================
#

def error( parser=None, message="generic error" ):
	print message
	if parser is not None:
		parser.print_help()
	exit(-1)


def main( argv):
	usage = "usage: %prog -c corpus_name -w function [-f filename]"
	parser = OptionParser( usage=usage )
	parser.add_option(
		"-c", "--corpus", dest="corpus",
		help="anta corpus_name")
	parser.add_option(
		"-f", "--filename", dest="filename",
		default="EN",
		help="use this option with function 'tagsfromcsv'")
	
	parser.add_option(
		"-w", "--function", dest="function",
		help="import function to be used. Nothe that some function may require addictional parameters.")
	
	( options, argv ) = parser.parse_args()
	
	
	if options.corpus is None:
		error( message="Use -c to specify the corpus", parser=parser )
	
	if options.function is None:
		error( message="Use -c to specify the function", parser=parser )
	
	# switch between functions. to be improved
	if options.function == "tagsfromcsv":
		if options.filename is None:
			error( message="'tagsfromcsv' param -f not found", parser=parser )
		tagsfromcsv( options, parser )
		
	sync(options, parser )




if __name__ == '__main__':
	# get corpus name
	main(sys.argv[1:])