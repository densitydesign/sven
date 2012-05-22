from pattern.vector import Corpus, Document, stopwords, count
from pattern.search import search
from pattern.nl     import parse as nlparse, Sentence as nlSentence, Text as nlText
from pattern.en     import parse as enparse, Sentence as enSentence, Text as enText
import json

def distill( filename, language="en", regexp="NP", stopwords=["the","this","a", "he", "me"]):
	# return a silly dictionary for the given txt utf8 file.
	# an a lookup mechanism to bind word with prhrases
	if language == "nl":
		_Text = nlText
		_parse = nlparse
	else:
		_Text = enText
		_parse = enparse
	
	try:
		content = open( filename, "r" )
 		content = content.read()
	except:
		return False
 	# corpus = Corpus(documents=[Document( content )])
	results = {}
	
	# some keywords
	results['keywords'] = Document( content ).keywords(top=20)
	
	
	# parsing according to regexp provided ("NP" or "NP is NP" etc...)
	lemma = _Text( _parse ( content, lemmata=True) )	# Parsing will take time, result should be cached.
	document = [ search( regexp, v ) for v in lemma ]		# List of all matches. SLOW, cache results.

	# return the document as a long NP list
	results[ 'matches' ] = []
	results[ 'phrases' ] = phrases = {}
	
	# create dictionaruy from stopwords {'this': True, 'the': True}
	stopwords = dict.fromkeys( stopwords, True )
	print stopwords
	
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
	#print distill( "../warehouse/2012_DMB_actorenbevraging_Fevia_Nachtergaele.docx.txt", language="nl")
	print json.dumps( distill( "../warehouse/pinocchio.chapter-01.en.txt", language="en") )