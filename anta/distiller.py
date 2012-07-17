
import json, codecs, sys, os

# get path of the django project
path = ("/").join( sys.path[0].split("/")[:-2] )
if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'sven.settings'

from pattern.vector import Corpus, Document, stopwords, count
from pattern.search import search as p_search
import pattern.nl #     import parse as nlparse, split as nlsplit, Sentence as nlSentence, Text as nlText
import pattern.en  #   import parse as enparse, Sentence as enSentence, Text as enText


from django.conf import settings
from optparse import OptionParser
from sven.anta.sync import error
from sven.anta.log import log
from sven.anta.utils import *
from sven.core.utils import *

def endistill( filename, regexp="NP", stopwords=["the","this","a", "he", "me"] ):
	
	f = codecs.open( filename, "r", "utf-8" )
 	content = f.read()
	
	text = pattern.en.Text( pattern.en.parse( content, lemmata=True ) )
	document =  [ p_search('NP', s) for s in text ]
	return evaporate( document, stopwords=dict.fromkeys( stopwords, True ), keywords=Document( content, exclude=stopwords ).keywords(top=20) )


# given a lemmatized document
# output a dictionary of useful object. Print out the keywords, too
def evaporate( document, stopwords, keywords ):
	results = {'keywords':keywords, 'stopwords': stopwords, 'segments':[], 'concepts':{} }
	
	for matches in document:
		
		for match in matches:
			
			# print match
			# print match.string
			# true if the segment-mathc contains at least one salient word (not in stopword)
			contains_concept = False
			
			# the chain of word to search for
			salient_words = []
			
			for word in match:
				
				# clean word.lemma...
				# print word.lemma
				word.lemma = strip_punctuation( word.lemma )
				# print word.lemma
				# print
				if len( word.lemma ) < 2 :
					continue
				

				if word.lemma in stopwords:
					continue
				
				if is_number( word.lemma ):
					continue
					
				# has_at least_one_salient_word
				contains_concept = True
				# lookup table "monetary" => "the monetary aspect"
				if word.lemma not in results['concepts']:
					results['concepts'][ word.lemma ] = {
						'segments':[]
					}
				salient_words.append( word.lemma )
				
				results['concepts'][ word.lemma ]['segments'].append( match.string )
			
			# determine tf of the segment! only if it contains some concept
			if contains_concept:
				results['segments'].append( [match.string, sorted(set(salient_words)), 1] )
				
	num_segments = len(results['segments'])
	
	for i in range( num_segments ):
		for j in range( i + 1 ):
			if i == j:
				continue
			if results['segments'][i][1] == results['segments'][j][1]:
				# if the ordered list of lemma are equals, then increment tf...
				results['segments'][i][2] = results['segments'][i][2] + 1
				results['segments'][j][2] = results['segments'][j][2] + 1
				
				# [test] print equal list of lemma
				# print i,j,results['segments'][i][0],results['segments'][j][0], results['segments'][i][2],results['segments'][j][2]
	
	# assign segment tf number of occurences of a word / number of words in document for each segment
	for i in range( num_segments ):
		# tf normalisation
		results['segments'][i][2] = float( results['segments'][i][2] ) / num_segments
	
	
	#print match.string, [ m.start() for m in re.finditer( match.string.lower(), content.lower() ) ]
	print results['segments'][:6]
	# number of segments in document
	print "[info] segments in document:",num_segments	
			
	return results

def nldistill( filename, regexp="NP", stopwords=["the","this","a", "he", "me"] ):
	f = codecs.open( filename, "r", "utf-8" )
 	content = f.read()
	
	text = pattern.nl.Text( pattern.nl.parse( content, lemmata=True ) )
	document =  [ p_search('NP', s) for s in text ]
	
	return evaporate( 
		document, 
		stopwords=dict.fromkeys( stopwords, True ), 
		keywords=Document( content, exclude=stopwords ).keywords(top=20) 
	)
	

def distill( filename, language="en", regexp="NP", stopwords=["the","this","a", "he", "me"]):
	# return a silly dictionary for the given txt utf8 file.
	# an a lookup mechanism to bind word with prhrases
	if language == "nl":
		return nldistill( filename, regexp, stopwords )
	else :
		return endistill( filename, regexp, stopwords )
	
	
	f = codecs.open( filename, "r", "utf-8" )
 	content = f.read()
	
	results = {}
	
	
	# some keywords
	results['keywords'] = Document( content, exclude=stopwords ).keywords(top=20)
	segments = []
	phrases = {}
	
	
	text		= parse("the cat is on the table", lemmata=True) # Parsing will take time, result should be cached.
	text		= split( text )
	print repr( text)
	groups		= [search("NP", s) for s in text ]
	
	for v in sentences:
		print search( regexp, v )
	
	
	return	
	print search( regexp, sentences )
	return
	groups		= [search( regexp, v ) for v in sentences]
			 # List of all matches. SLOW, cache results.
	
	print groups
	# create dictionaruy from stopwords {'this': True, 'the': True}
	stopwords = dict.fromkeys( stopwords, True )
	
	for matches in groups:
		for match in matches:
			for word in match:
				print word
				break
			break
		break
	
	#corpus = [search("NP", v) for v in corpus]           # List of all matches. SLOW, cache results.
	return
	for match in corpus[0][:30]:
		print match.string # E.g., "the monetary aspects".
	
	return
	# parsing according to regexp provided ("NP" or "NP is NP" etc...)
	sentences = _Text( _parse ( content, lemmata=True) )	# Parsing will take time, result should be cached.
	for l in lemma:
		print l
		break;
	document = [ search( regexp, v ) for v in lemma ]		# List of all matches. SLOW, cache results.

	# return the document as a long NP list
	results[ 'matches' ] = []
	results[ 'phrases' ] = phrases = {}
	
	# create dictionaruy from stopwords {'this': True, 'the': True}
	stopwords = dict.fromkeys( stopwords, True )
	
	for matches in document:
		for match in matches:
			results[ 'matches' ].append( match.string )
			for word in match:
				# print word, word.lemma, e.g Word(u'PIECE/NN') piece
				
				# stopwords for dummy word, like "the", or "it"
				if word.lemma in stopwords:
					continue
				
				# lookup table "monetary" => "the monetary aspect"
				if word.lemma not in phrases:
					
					phrases[ word.lemma ] = []
				phrases[ word.lemma ].append( match.string )
			
			# row matches: do not stringify
			# results[ 'matches' ].append( word.string )
	 
            
	return results
	
 
 
 	
if __name__ == '__main__':
	usage = "usage: %prog -f filename -l language"
	parser = OptionParser( usage=usage )
	parser.add_option(
		"-f", "--filename", dest="filename",
		help="test anta distiller with a utf8 encoded txt file of your choice")
	parser.add_option(
		"-l", "--language", dest="language",
		help="test anta distiller with a utf8 encoded txt file of your choice")
	
	( options, argv ) = parser.parse_args()
	
	if options.filename is None:
		error( message="Use -f to specify the path to the filename", parser=parser )
	
	if options.language is None:
		error( message="Use -l to specify the language, 2chars lower, e.g. 'en'", parser=parser )
	
	
	print distill( filename=options.filename, language=options.language )
	#print distill( "../warehouse/2012_DMB_actorenbevraging_Fevia_Nachtergaele.docx.txt", language="nl")
	# print json.dumps( distill( "../warehouse/pinocchio.chapter-01.en.txt", language="en") )
