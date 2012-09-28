import os, sys, time, urllib, json



# get path of the django project
ALCHEMY_API_NAMED_ENTITIES_URL = "http://access.alchemyapi.com/calls/text/TextGetRankedNamedEntities"

# basic class to migrate from service to service.
# every service get a text as input and return an array of Entity object as a result
class Entity:
	content = ""
	context = ""

	def __init__(self):
		pass

# load some basic stuff

def bottleneck( text, service ):
	pass

#
#   Call Semantria Web service.
#   settings.SEMANTRIA_API_KEY should be loaded.
#
def semantria():
	pass


#
#   Call AlchemyApi service by Orchestr8
#   settings.ALCHEMY_API_KEY
#
def alchemy( apikey="", text="A black cat sat on the black carpet", outputMode="json"):
	print """
	========================
	---- ALCHEMY API WS ----
	========================
	"""

	#time.sleep(5)
	params = urllib.urlencode({
		'apikey': apikey,
		'text': text, 
		'outputMode': outputMode
	})
	f = urllib.urlopen( ALCHEMY_API_NAMED_ENTITIES_URL, params )
	
	result = json.loads( f.read() )
	
	if result['status'] == 'ERROR':
		raise Exception( "[alchemy] JSON.loads ERROR result: %s " % result['statusInfo'])
		

	print result
	print ALCHEMY_API_NAMED_ENTITIES_URL
	pass

