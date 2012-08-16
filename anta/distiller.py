#
#    ===================
#    ---- DISTILLER ----
#    ===================
#
#    Distiller script contains language-specific Pattern function
#    for NP extraction.
# 
from pattern.vector import Corpus, Document, stopwords, count
from pattern.search import search as p_search
import pattern.nl #     import parse as nlparse, split as nlsplit, Sentence as nlSentence, Text as nlText
import pattern.en  #   import parse as enparse, Sentence as enSentence, Text as enText

import codecs
from optparse import OptionParser


def evaporate( document, stopwords, keywords ):
	"""
	Return a dictionary: {'keywords':keywords, 'stopwords': stopwords, 'segments':[], 'concepts':{} }
	1. tf based keywords, 
	2. stopwords used, 
	3. NP segments extracted and concept, that is all the stemmed words found
	4. dictionary of stopwords

	{
	 'keywords': [(0.125, u'appeared'), (0.125, u'disney')], 
	 'stopwords': {'this': True, 'a': True, 'the': True, 'me': True, 'he': True}, 
	 'segments': [
	 	[u'Things Walt Disney Never', [u'disney', u'never', u'things', u'walt'], 0.3333333333333333], 
	 	[u'Us* THE FOLLOWING ITEM', [u'following', u'item', u'us*'], 0.3333333333333333], 
	 	[u'a Winnipeg newspaper', [u'newspaper', u'winnipeg'], 0.3333333333333333]
	 ], 
	 'concepts': {
	 	u'newspaper': {'segments': [u'a Winnipeg newspaper']}, 
	 	u'things': {'segments': [u'Things Walt Disney Never']}, 
	 	u'never': {'segments': [u'Things Walt Disney Never']}, 
	 	u'us*': {'segments': [u'Us* THE FOLLOWING ITEM']}, 
	 	u'walt': {'segments': [u'Things Walt Disney Never']}, 
	 	u'item': {'segments': [u'Us* THE FOLLOWING ITEM']}, 
	 	u'winnipeg': {'segments': [u'a Winnipeg newspaper']}, 
	 	u'following': {'segments': [u'Us* THE FOLLOWING ITEM']}, 
	 	u'disney': {'segments': [u'Things Walt Disney Never']}
	 }
	}
	given a lemmatized document
	"""
	results = {'keywords':keywords, 'stopwords': stopwords, 'segments':[], 'concepts':{} }
	
	for matches in document:
		print
		for match in matches:
			print "----",match.string, match.words
			# true if the segment-mathc contains at least one salient word (not in stopword)
			contains_concept = False
			
			# the chain of word to search for
			salient_words = []
			
			for word in match.words:
				print word.lemma
				print
				if len( word.lemma ) < 2 :
					continue
				
				if word.lemma in stopwords:
					continue
				
				#if is_number( word.lemma ):
				#	continue
					
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

	

def distill( filename, language="en", regexp="NP", stopwords=["the","this","a", "he", "me"], stems={'things':'thing'}):
	# return a silly dictionary for the given txt utf8 file.
	# an a lookup mechanism to bind word with prhrases
	f = codecs.open( filename, "r", "utf-8" )
 	content = f.read()
	
	if language == "nl":
		text = pattern.nl.Text( pattern.nl.parse( content, lemmata=True ) )
	else:
		# default: language == "en":
		text = pattern.en.Text( pattern.en.parse( content, lemmata=True ) )
		
	document =  [ p_search('NP', s) for s in text ]
	
	return evaporate( 
		document, 
		stopwords=dict.fromkeys( stopwords, True ),
		keywords=Document( content, exclude=stopwords ).keywords(top=20) 
	)
	
 	
if __name__ == '__main__':
	usage = "usage: %prog -f filename -l language"
	parser = OptionParser( usage=usage )
	parser.add_option(
		"-f", "--filename", dest="filename",
		help="test pattern parser on a utf8 encoded txt file of your choice")
	parser.add_option(
		"-l", "--language", dest="language",
		help="test pattern parser on a utf8 encoded txt file of your choice")
	
	( options, argv ) = parser.parse_args()

	error = None
	if options.filename is None:
		error = "Use -f to specify the path to the filename"
	elif options.language is None:
		error = "Use -l to specify the language, 2chars lower, e.g. 'en'"
	
	if error is not None:
		print "\n\n", error, "\n\n"
		parser.print_help()
		print
		exit()
	
	print distill( filename=options.filename, language=options.language )
	#print distill( "../warehouse/2012_DMB_actorenbevraging_Fevia_Nachtergaele.docx.txt", language="nl")
	# print json.dumps( distill( "../warehouse/pinocchio.chapter-01.en.txt", language="en") )