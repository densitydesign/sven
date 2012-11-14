#
#    ===================
#    ---- DISTILLER ----
#    ===================
#
#    Distiller script contains language-specific Pattern function
#    for NP extraction for a single filename. It could be used as standalone script with a filename.
#    Routine start/stop functions are also stored here.
# 
from pattern.vector import Corpus, Document, stopwords, count
from pattern.search import search as p_search
import pattern.nl #     import parse as nlparse, split as nlsplit, Sentence as nlSentence, Text as nlText
import pattern.en  #   import parse as enparse, Sentence as enSentence, Text as enText

import codecs, re, logging
from datetime import datetime
from optparse import OptionParser

logger = logging.getLogger("sven.anta.metrics")

#
#    ===================
#    ---- STOPWORDS ----
#    ===================
#
NL_STOPWORDS = ["aan","af","al","alles","als","altijd","andere","ben","bij","daar","dan","dat","de","der","deze","die","dit","doch","doen","door","dus","een","eens","en","er","ge","geen","geweest","haar","had","heb","hebben","heeft","hem","het","hier","hij","hij ","hoe","hun","iemand","iets","ik","in","is","ja","je","je ","kan","kon","kunnen","maar","me","meer","men","met","mij","mijn","moet","na","naar","niet","niets","nog","nu","of","om","omdat","onder","ons","ook","op","over","reeds","te","tegen","toch","toen","tot","u","uit","uw","van","veel","voor","want","waren","was","wat","we","wel","werd","wezen","wie","wij","wil","worden","wordt","zal","ze","zei","zelf","zich","zij","zijn","zo","zonder","zou"]
EN_STOPWORDS = ["i","me","my","myself","we","us","our","ours","ourselves","you","your","yours","yourself","yourselves","he","him","his","himself","she","her","hers","herself","it","its","itself","they","them","their","theirs","themselves","what","which","who","whom","this","that","these","those","am","is","are","was","were","be","been","being","have","has","had","having","do","does","did","doing","will","would","shall","should","can","could","may","might","must","ought","i'm","you're","he's","she's","it's","we're","they're","i've","you've","we've","they've","i'd","you'd","he'd","she'd","we'd","they'd","i'll","you'll","he'll","she'll","we'll","they'll","isn't","aren't","wasn't","weren't","hasn't","haven't","hadn't","doesn't","don't","didn't","won't","wouldn't","shan't","shouldn't","can't","cannot","couldn't","mustn't","let's","that's","who's","what's","here's","there's","when's","where's","why's","how's","daren't","needn't","oughtn't","mightn't","a","an","the","and","but","if","or","because","as","until","while","of","at","by","for","with","about","against","between","into","through","during","before","after","above","below","to","from","up","down","in","out","on","off","over","under","again","further","then","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very"]


#
#    =======================
#    ---- ROUTINE UTILS ----
#    =======================
#
def start_routine( type, corpus=None ):
	"""
	If a routine does not exist, it will create it.
	If a routine exists and:
		1. is OK, routine will be set to RIP; a new one will be created.
		2. is PN, outine won't be overridden and 
	Return the current routine, created or not.
	"""
	from sven.anta.models import Routine
	# exclude finished, closed with error and closed tout-court.
	try:
		r = Routine.objects.exclude( status="OK").exclude(status="CLO").exclude(status="RIP").filter( type=type, corpus=corpus ).order_by( "-pk")[0]
	except Exception, e:
		# normally List index out of range, create a brand new one
		r = Routine( type=type, corpus=corpus )
		r.save()
		return r

	# completed.
	if r.status == "OK" :
		return restart_routine( r, status="RIP")
	
	if r.status == "ERR":
		return restart_routine( r, status="CLO")
	
	if r.status == "PN" :
		raise Exception("routine of this type is already running!")
	return r
	
	

def restart_routine( routine, status="RIP" ):
	routine.status	= status
	routine.end_date= datetime.now()
	routine.save()
	r = start_routine( type=routine.type, corpus=routine.corpus )
	return r

def log_routine( routine, entry="", completion=None, status="PN", completion_start=0.0, completion_score=1.0 ):
	routine.status		= status
	routine.last_entry	= entry
	
	if completion is not None:
		routine.completion = completion_start + (completion * completion_score)

	routine.save()
	return routine

def close_routine( routine, error="", status="CLO"):
	routine.status	= status
	routine.last_entry	= error
	routine.end_date		= datetime.now()
	if status =="OK":
		routine.completion = 1.0
	
	routine.save()
	return routine

def stop_routine( routine ):
	routine.status	= "OK"
	routine.end_date	= datetime.now()
	routine.save()
	return r


# decant function,
# foreach documents
#    extract with distill tags and NP
#       attach tags to document (automatic pseudotagging)
#    save every NP found along with specifid tf (term frequency )
# once finished
#    recalculate tf/idf foreach tf
#
def decant( corpus, routine, settings, ref_completion=1.0 ):
	from sven.anta.models import Analysis, Routine, Segment, Segment_Concept, Document, Document_Segment, Document_Tag, Tag, Concept
	from sven.anta.utils import textify
	# path = settings.MEDIA_ROOT + options.corpus
	# print NL_STOPWORDS
	logger.info( "starting pattern analysis on corpus: '%s' [%s]" % ( corpus.name, corpus.id ) )
	# get document corpus
	
	log_routine( routine, entry="[info] starting pattern analysis on corpus: %s" % corpus.id )
	
	
	# current analysis, if any
	try: 
		analysis = Analysis.objects.get(corpus=corpus, type="PT")
	except Analysis.DoesNotExist:
		analysis = Analysis( corpus=corpus, type="PT", start_date=datetime.now(), status="CRE" )
		analysis.save()
	except:
		raise

	routine.analysis.add( analysis )
	routine.save()

	# total count
	total_count = Document.objects.filter(corpus=corpus).count()


	# current document (new)
	documents =  Document.objects.filter(corpus__id=corpus.id, status='NEW')

	# if analysis.document is None:
	#	documents = Document.objects.filter(corpus__id=corpus.id)
	#	analysis.document = documents[0]
	#else:
	#	documents = Document.objects.filter(corpus__id=corpus.id, id__gt=analysis.document.id)
	#	if documents.count() == 0:
	#		documents = Document.objects.filter(corpus__id=corpus.id)

	# pending status for current analysis
	analysis.status = "PN"
	analysis.save()

	i = 0

	# cycle through documents
	for d in documents:
		i = i + 1
		d.status='IN'
		d.save()

		# update analysis with current document
		analysis.document = d
		analysis.save()

		log_routine( routine, completion=ref_completion * i / total_count )

		# a = Analysis( document=d, )
		logger.info("%s / %s trying to convert document '%s' [%s], mimetype %s" % ( i, total_count, d.title, d.id, d.mime_type) )

		try:
			textified =  textify( d, settings.MEDIA_ROOT )
		except Exception, e:
			analysis.status="ERR"
			d.status = 'ERR'
			d.save()
			analysis.save()
			logger.error("%s / %s FAILED converting document '%s' [%s], mimetype %s with Exception: %s" % ( i, total_count, d.title, d.id, d.mime_type, e) )
			continue

		if textified == False:
			analysis.status="ERR"
			d.status = 'ERR'
			d.save()
			analysis.save()
			logger.error("%s / %s FAILED converting document '%s' [%s], mimetype %s" % ( i, total_count, d.title, d.id, d.mime_type) )
			continue
		
		textified = textified.replace("%20"," ")
		analysis.completion = 0.0
		analysis.document = d
		analysis.save()
		
		# load storpwords for document d language
		if d.language == "NL": 
			stopwords = NL_STOPWORDS
		elif d.language == "EN":
			stopwords = EN_STOPWORDS
		else:
			stopwords = []

		
		logger.info("%s / %s NP extraction started over document '%s' [%s], language: '%s', file: '%s'" % ( i, total_count, d.title, d.id, d.language, textified) )

		#start distill anaysis, exclude given stopwors
		try:
			distilled = distill( filename=textified, language=d.language.lower(), stopwords=stopwords )
		except Exception, e:
			d.status = 'ERR'
			logger.error("%s / %s FAILED distill document '%s' [%s], mimetype %s with Exception: %s" % ( i, total_count, d.title, d.id, d.mime_type, e) )
			d.save()
			continue

		analysis.completion = .1
		analysis.save()

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
				try:
					t.save()
				except:
					print "[warning] unable to save as tag:", candidate
					continue
		 	
		 	# set tag documnt relation
		 	try:
		 		td = Document_Tag( document=d, tag=t)	
		 		td.save()
		 	except:
		 		#relation exist,
		 		continue
		analysis.completion = .5
		analysis.save()
		# segment
		first = True
		for segment in distilled['segments']:
						

			if len(segment[0]) > 128:
				print "[warning] sample 'segment' will be truncated:", segment[0]
				continue
			try:
				s = Segment.objects.get( content=segment[0][:128], language=d.language)
			except:
				s = Segment( content=segment[0][:128], stemmed=re.sub("\s+", ' ', " ".join(segment[1])[:128] ), language=d.language )
				try:
					s.save()
				except:
					print "[warning] unable to save segment:", segment[0][:128]
					continue
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
				# ignore numbers				
				k = re.sub("[\d\-\.]+","", k)
				if len(k) < 2:
					continue
				try:
					c = Concept.objects.get( content=k, language=d.language)
				except:
					try:
						c = Concept( content=k, language=d.language )

						c.save()
					except Exception, e:
						print "[warning] unable to save concept: %s, exception: %s" % (k, e)
						continue
				try:
					sc = Segment_Concept.objects.get( segment=s, concept=c )
				except:
					sc = Segment_Concept( segment=s, concept=c )
					sc.save()	
					
				if first:
					print "[info] sample 'concept' saved:",c.id, c.content

			first = False
			
		
		
		print "[info] analysis ended on doc", d.id,"'", d.title,"'"
	
	print "[info] analysis completed on corpus:", corpus.id
	analysis.status = "OK"
	analysis.end_date = datetime.utcnow()
	analysis.save()


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
		for match in matches:
			# true if the segment-mathc contains at least one salient word (not in stopword)
			contains_concept = False
			
			# the chain of word to search for
			salient_words = []
			
			for word in match.words:
				#print word.lemma
				#print
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

	logger.info( "NP found: %s" %  num_segments )
	
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
	# print results['segments'][:6]
	logger.info( "NP sample: %s" %  results['segments'][:6] )
	# number of segments in document
	

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