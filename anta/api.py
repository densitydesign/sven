from django.http import HttpResponse, HttpRequest, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from sven.anta.models import *
from django.conf import settings
from django.contrib.auth import login, logout
import os, json, datetime

from sven.anta.utils import *
from django.contrib.auth.models import User
 
#
#    ========================
#    ---- JSON API CONST ----
#    ========================
#
API_LOGIN_REQUESTED_URL = '/sven/anta/api/login-requested'	 # needs to be logged in
API_ACCESS_DENIED_URL = '/sven/anta/api/access-denied'	 # needs to be logged in and th corpus should be cool



#
#    ==================================
#    ---- ASSISTANT JSON API VIEWS ----
#    ==================================
#

def index(request):
	response = _json( request )
	#user = User.objects.create_user('daniele', 'lennon@thebeatles.com', 'danielepassword')
	#user.is_staff = True
	#user.save()
	return render_to_json( response )
	
	
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def add_relation(request):
	response = _json( request )
	corpus = request.REQUEST.get('corpus','')
	source = request.REQUEST.get('source','')
	target = request.REQUEST.get('target','')
	description = request.REQUEST.get('description','')
	polarity = request.REQUEST.get('polarity','?')
	
	response['testaz'] = corpus
	
	# test vars here @todo
	corpus = _get_corpus( corpus )
	if corpus is None:
		return throw_error( response, "corpus does not exist...")
	
	source = _get_document( source )
	if source is None:
		return throw_error( response, "source id document does not exist or is not valid")
	
	target = _get_document( target ) 
	if target is None:
		return throw_error( response, "target id document does not exist or is not valid")
	
	if target.id == source.id:
		return throw_error( response, "self-to-self relations are currently not supported, sorry")
	
		
	# create relation oblject
	try:
		r = Relation( source=source, target=target, description=description, polarity=polarity, owner=request.user )
		r.save()
	except:
		return throw_error( response, "a relationship has already been extablished between these documents")
	
	response[ 'relation' ] = { 
		'id': r.id,
		'polarity': polarity,
		'source': source.id,
		'target': target.id
	}
	
	return render_to_json( response )

@login_required
def remove_relation(request, relation_id):
	
	response = _json( request )
	
	corpus = request.REQUEST.get('corpus','')
	
	corpus = _get_corpus( corpus )
	if corpus is None:
		return throw_error( response, "corpus does not exist...")
	r = Relation.objects.get( id=relation_id, owner=request.user )
	#except:
	#	return throw_error( response, "relation does not exist or you have no permission to modify it")
	
	return render_to_json( response )

@login_required
def get_documents(request):
	
	response = _json( request )
	
	corpus = request.REQUEST.get('corpus','')
	
	corpus = _get_corpus( corpus )
	if corpus is None:
		return throw_error( response, "corpus does not exist...")
	
	
	docs = Document.objects.filter( corpus=corpus )
	response['documents'] = []
	
	for d in docs :
		response['documents'].append({
			'id':d.id,
			'title':d.title,
			'date':d.ref_date.isoformat(),
			'mime_type':d.mime_type
		})
		
	#except:
	#	return throw_error( response, "relation does not exist or you have no permission to modify it")
	
	return render_to_json( response )

@login_required
def get_document(request, document_id):
	response = _json( request )
	
	d = _get_document( document_id )
	if d is None:
		return throw_error( response, "dcument does not exist...")
	
	text = textify( d, settings.MEDIA_ROOT )
	
	if text is None:
		return throw_error( response, "unable to provide txt version of the document")
	
	# f = open( text, "r")
		
	response['document'] = { 'id':d.id,
		'title':d.title,
		'date':d.ref_date.isoformat(),
		'mime_type':d.mime_type,
		'url': d.url.url,
		'tags': []
	}
	
	for t in d.tags.all():
		response['document']['tags'].append({
			'id':t.id, 'name':t.name	
		})
	
		# transform
	# f = open( url, "r")
	# response['document']['content'] = f.read()
	
	
	
	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def dummy_gummy( request ):
	# test only view, with request
	response = _json( request )
	return render_to_json( response )
	
def logout_view( request ):
	logout( request )
	response = _json( request )
	return render_to_json( response )
	

#
#    =======================
#    ---- ACCESS DENIED ----
#    =======================
#

def login_requested( request ):
	response = _json( request )
	return throw_error( response, error="you're not authenticated", code="auth failed" )





def access_denied( request ):
	response = _json( request )
	return throw_error( response, error="access denied", code="forbidden" )



#
#    ==========================
#    ---- API VIEW HELPERS ----
#    ==========================
#
#    try except handling on the road
#

	

def _get_corpus( corpus, user=None ):
	# given a corpus name return None or a corpus object
	try:
		c = Corpus.objects.get(name=corpus)
		return c
	except:
		return None

def _get_document( document_id ):
	# given a document id return None or a corpus object
	try:
		d = Document.objects.get(id=document_id)
		return d
	except:
		return None

def _json( request ):
	j =  {"status":"ok"}
	j['meta'] = {'offset':0,'limit':10 }
	
	if request.user is not None:
		j['user'] = request.user.username
	return j
	
def render_to_json( response ):
	
	return HttpResponse( json.dumps( response ), mimetype="text/plain")

def throw_error( response, error="", status="ko", code="404" ):
	response[ 'error' ] = error
	response[ 'status' ] = status
	
	return HttpResponse( json.dumps( response ), mimetype="text/plain")