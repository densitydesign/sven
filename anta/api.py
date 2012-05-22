from django.http import HttpResponse, HttpRequest, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from sven.anta.models import *
from django.conf import settings
import os, json, datetime

from sven.anta.utils import *

#
# API ACCESS
# ==========
#
# json text/plain reponse
#

def index(request):
	response = _json( request )
	return render_to_json( response )
	
	
@login_required
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
	
	f = open( text, "r")
		
	response['document'] = {
		'id':d.id,
		'title':d.title,
		'date':d.ref_date.isoformat(),
		'mime_type':d.mime_type,
		'url': d.url.url,
		'content': f.read()
	}
	
	
		# transform
	# f = open( url, "r")
	# response['document']['content'] = f.read()
	
	
	
	return render_to_json( response )
#
# API VIEW HELPER
# ===============
#

def _get_corpus( corpus ):
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
	
	if request.user is not None:
		j['user'] = request.user.username
	return j
	
def render_to_json( response ):
	
	return HttpResponse( json.dumps( response ), mimetype="text/plain")

def throw_error( response, error="", status="ko" ):
	response[ 'error' ] = error
	response[ 'status' ] = status
	
	return HttpResponse( json.dumps( response ), mimetype="text/plain")