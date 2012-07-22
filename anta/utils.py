# -*- coding: utf-8 -*-

from docx import *
import os, subprocess,re, codecs
from pattern.web    import PDF

NL_STOPWORDS = ["aan","af","al","alles","als","altijd","andere","ben","bij","daar","dan","dat","de","der","deze","die","dit","doch","doen","door","dus","een","eens","en","er","ge","geen","geweest","haar","had","heb","hebben","heeft","hem","het","hier","hij","hij ","hoe","hun","iemand","iets","ik","in","is","ja","je","je ","kan","kon","kunnen","maar","me","meer","men","met","mij","mijn","moet","na","naar","niet","niets","nog","nu","of","om","omdat","onder","ons","ook","op","over","reeds","te","tegen","toch","toen","tot","u","uit","uw","van","veel","voor","want","waren","was","wat","we","wel","werd","wezen","wie","wij","wil","worden","wordt","zal","ze","zei","zelf","zich","zij","zijn","zo","zonder","zou"]

EN_STOPWORDS = ["i","me","my","myself","we","us","our","ours","ourselves","you","your","yours","yourself","yourselves","he","him","his","himself","she","her","hers","herself","it","its","itself","they","them","their","theirs","themselves","what","which","who","whom","this","that","these","those","am","is","are","was","were","be","been","being","have","has","had","having","do","does","did","doing","will","would","shall","should","can","could","may","might","must","ought","i'm","you're","he's","she's","it's","we're","they're","i've","you've","we've","they've","i'd","you'd","he'd","she'd","we'd","they'd","i'll","you'll","he'll","she'll","we'll","they'll","isn't","aren't","wasn't","weren't","hasn't","haven't","hadn't","doesn't","don't","didn't","won't","wouldn't","shan't","shouldn't","can't","cannot","couldn't","mustn't","let's","that's","who's","what's","here's","there's","when's","where's","why's","how's","daren't","needn't","oughtn't","mightn't","a","an","the","and","but","if","or","because","as","until","while","of","at","by","for","with","about","against","between","into","through","during","before","after","above","below","to","from","up","down","in","out","on","off","over","under","again","further","then","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very"]


# pull all new documents found


def textify( d, absolute_url ):
	print
	
	# return an absolute url
	output = absolute_url + d.corpus.name + "/" + os.path.basename( d.url.url ).replace("%20"," ")
	
	print "[info] executing texify function for ", output
	
	
	if d.mime_type == "text/plain":
		print "[info]","file id:",d.id," is already a text/plain"
		return output
	
	text = output + ".txt"
	
	if os.path.exists( text ):
		print "[info]","file id:",d.id," textified version exists"
		return text
	
	print "[info]","file id:",d.id," transforming ", d.mime_type
	
	if d.mime_type == "application/pdf":
		if pdftotext( output ):
			# clean
			clean( text )
			return text
		else:
			return False
		
	if d.mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		if docxtotext( output ):
			clean( text )
			return text
	
	return False		

def clean( txtfile ):
	# excuded_pattern = [^\w+ \,\:\;\-\–àçòèé&@°\*\?\!\"\'\n]
	f = codecs.open( txtfile, encoding='utf-8', mode='r')
	content = f.read()
	content = content.replace( u"•","-" )
	content = re.sub( r"\-", "; ", content )
	content = re.sub("\|", "; ", content )
	content = re.sub(r'[\_\”\"\']+', " ", content )
	# exclude line with number only pages and so on.
	content = re.sub("\n+[\.\s\d]+\n+", ".\n", content )
	content = re.sub("\.+",".", content )
	content = re.sub("[ ]+"," ", content )

	f.close() 	

	f = codecs.open(txtfile, "w", "utf8")
	f.write(content)
	f.close()

	print content
	# clean more than one \n
	# f.write( content )

def strip_punctuation( s ):
	s = s.replace(u"’"," ")
	punkt = re.sub( r'[«• »\–\‘\’\[\]\\\^”\<\=\>\!\#\$’\-\'\–]',' ', s.replace( u"•","" ) ) # "\#\$\%\&\'\*\+\,-./:;<=>?@\[\\\]\^\_`\{\|\}\~]
	return re.sub('\s+',' ', punkt )

def uniquefn( filename ):
	#todo, if exists change filename
	return filename

def pdftotext( filename, output="" ):
	filename = filename.replace("%20"," ")
	f = codecs.open('test', encoding='utf-8', mode='w+')
	if len( output ) == 0:
		# handle bugus %20 replacement.... don't know where these are coming frm
		output = uniquefn( filename + ".txt" )
		comparison = filename + ".dif.txt"
	
	print "[transforming pdf]", filename
	
	
	#try:
	#	content = PDF( filename ).string
	#	output = open( output, 'w' ) 
	#	output.write( content.encode( "utf-8" ) )
	#except:
	#	return False
		
	try:
		subprocess.check_call("pdftotext -enc UTF-8 " + filename.replace(" ","\\ ") +" " + output.replace(" ","\\ "), shell=True)
	except:
		return False
	
	return True
	
	# print subprocess.check_call("pdftotext -enc UTF-8 " + filename.replace(" ","\\ ") +" " + output.replace(" ","\\ "), shell=True)
	

def docxtotext( docx, output="" ):
	# convert a .docx to a .txt utf8 or similar
	docx = docx.replace("%20"," ")
	if len( output ) == 0:
		output = uniquefn( docx + ".txt" )
	
	
	try:
		document = opendocx( docx )
		output = open( output, 'w' ) 
	except:
		return False
	
	paratextlist = getdocumenttext(document)    

	# Make explicit unicode version    
	newparatextlist = []
	for paratext in paratextlist:
		newparatextlist.append( paratext.encode( "utf-8" ) )                  
    
    ## Print our documnts test with two newlines under each paragraph
	output.write( '\n\n'.join( newparatextlist ) )
    
	return True

if __name__ == '__main__':
	# test here
	
	# pdftotext("../media/ecodesign/DG Environment_EN_20120101_Product Environmental Footprint Guide.pdf")
	print strip_punctuation("• • • • <=> product system’’ –‘intelligent’ money here!”braunhart-cradle’-delft-dienst-e.-manzini-mcdonough-product-systeem-tu")
	clean("/home/daniele/public/sven/media/ecodesign/OVAM_NL_20080530_Ecodesign.pdf.txt")
	



	
