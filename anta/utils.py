from docx import *
import os

def textify( d, absolute_url ):
	# return an absolute url
	output = absolute_url + d.corpus.name + "/" + os.path.basename( d.url.url )
	
	if d.mime_type is "text/plain":
		return output
	
	text = output + ".txt"
	
	if os.path.exists( text ):
		return text
	
	if d.mime_type is "application/pdf":
		return output
		
	if d.mime_type is "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		if docxtotext( output ):
			return text
	
	return text		
	
def uniquefn( filename ):
	#todo, if exists change filename
	return filename

def docxtotext( docx, output="" ):
	# convert a .docx to a .txt utf8 or similar
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
	
