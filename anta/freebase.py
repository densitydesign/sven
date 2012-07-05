# -*- coding: utf-8 -*-
#
#    ======================
#    ---- FREEBASE API ----
#    ======================
#

import sys, json, urllib2, re
from urllib import urlencode


FREEBASE_API_URL = "https://www.googleapis.com/freebase/v1/"

<<<<<<< HEAD
def search( params, notable_only=True, universe=None ):
=======
def fsearch( params, notable_only=True, universe=None ):
>>>>>>> origin
	url = FREEBASE_API_URL + "search?" + urlencode( params )
	response = load( url )
	
	if universe:
		print "matching", universe.lower()
		find_universe = re.compile( universe.lower() )
	
	if notable_only:
		filtered_response = []
		for r in response['result']:
			if 'notable' in r:
				if universe:
					if re.search( universe.lower(), r['notable']['id'] ) is not None:
						print "matches", universe,":",r['score'], r['notable']['id'], r['notable']['name'], r['name']
				else:
					print r['score'], r['notable']['id'], r['notable']['name'], r['name']
				filtered_response.append( r )
				
		return filtered_response	
	
	return response

def load( url ):
	return json.loads( urllib2.urlopen(url).read() )


def main( argv ):
	# test purpose only
	params = {}
	
	if len( argv ) < 2 :
		params['query']	= raw_input("search query : ")
		params['lang']	= raw_input("language, e.g. 'fr' : ")
	else:
		params['query'] = argv[0]
		params['lang']	= argv[1]
	
	print params
	
<<<<<<< HEAD
	print search( params )
=======
	print fsearch( params )
>>>>>>> origin
	


if __name__ == '__main__':
	# test only
	main(sys.argv[1:])
