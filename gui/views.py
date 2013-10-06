import tempfile
import shutil
import json

from datetime import datetime
from django.db.models import Q
from django.http import HttpResponse, HttpRequest, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect, get_object_or_404
from django.template import RequestContext
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import login, logout, authenticate

from sven.anta.forms import LoginForm
from sven.anta.models import *
from sven.anta.api import *

CUSTOM_SETTINGS = {
	'STATIC_URL': settings.STATIC_URL, #'/static/',
	'LOGIN_URL':'/gui/login'
}

# Login
def login_view(request):
	
	data = {}
	data['active'] = "login"
	data['custom'] = CUSTOM_SETTINGS
	
	redirect_to = request.REQUEST.get( 'next', 'gui_documents' )
	
	if request.method == 'POST':
		data['loginform'] = form = LoginForm( request.POST )
		if form.is_valid():
			
			user = authenticate(username=form.cleaned_data['username'], password=form.cleaned_data['password'])
			
			if user is not None:
				if user.is_active:
					login(request, user)
					return redirect(redirect_to)
				else:
					data['loginerror'] = "user is not active"
			else:      
				data['loginerror'] = "user does not exist"
		else:
			data['loginerror'] = "form failed"    
	else:
		data['loginform'] = LoginForm()
	
	c = RequestContext(request, data)
	return render_to_response("gui/login.html", c)

def logout_view(request):
	
	data = {}
	data['custom'] = CUSTOM_SETTINGS
	logout( request )
	data['loginform'] = LoginForm()
	c = RequestContext(request, data)
	return render_to_response('gui/login.html', c)

# Documents/Index
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def documents(request, id_document=None):
	data = _shared_context( request, active="documents" )
	# data['custom'] = CUSTOM_SETTINGS
	# data['active'] = "documents"
	# data['corpus'] = {"id":request.session.get("corpus_id", 0), "name":request.session.get("corpus_name", "") }
	#print document(request, id_document)
	if id_document != None:
		data['id_document'] = id_document
		return render_to_response("gui/document.html", RequestContext(request, data))
	
	return render_to_response("gui/documents.html", RequestContext(request, data))

# Single relation handler
# push documents template with source / target already displayed
# @param id_relation
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def relations(request, id_relation ):
	data = {}
	data['custom'] = CUSTOM_SETTINGS
	data['active'] = "documents"
	data['corpus'] = {"id":request.session.get("corpus_id", 0), "name":request.session.get("corpus_name", "") }
	
	data['relation'] = r = get_object_or_404( Relation, id=id_relation )
	data['id_document'] = r.source.id
	return render_to_response("gui/document.html", RequestContext(request, data))

# Timeline
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def timeline(request):
	data = {}
	data['active'] = "timeline"
	data['custom'] = CUSTOM_SETTINGS
	data['corpus'] = {"id":request.session.get("corpus_id", 0), "name":request.session.get("corpus_name", "") }
	c = RequestContext(request, data)
	return render_to_response("gui/timeline.html", c)
	
	
# Dynamics
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def dynamics(request):
	data = {}
	data['active'] = "dynamics"
	data['custom'] = CUSTOM_SETTINGS
	data['corpus'] = {"id":request.session.get("corpus_id", 0), "name":request.session.get("corpus_name", "") }
	c = RequestContext(request, data)
	return render_to_response("gui/dynamics.html", c)

# Stream
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def stream(request):
	data = {}
	data['active'] = "stream"
	data['custom'] = CUSTOM_SETTINGS
	data['corpus'] = {"id":request.session.get("corpus_id", 0), "name":request.session.get("corpus_name", "") }
	c = RequestContext(request, data)
	return render_to_response("gui/stream.html", c)

# Corpora
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def corpora(request):
	data = {}
	data['active'] = "corpora"
	data['custom'] = CUSTOM_SETTINGS
	data['corpus'] = {"id":request.session.get("corpus_id", 0), "name":request.session.get("corpus_name", "") }
	c = RequestContext(request, data)
	return render_to_response("gui/corpora.html", c)
	
# PdfViewer
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def pdfviewer(request):
	data = {}
	data['active'] = "pdfviewer"
	data['custom'] = CUSTOM_SETTINGS
	c = RequestContext(request, data)
	return render_to_response("gui/viewer.html", c)

@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def corpus_documents(request, corpus_name=None):
	data = _shared_context( request, corpus_name, active="documents" )
	return render_to_response("gui/corpus_documents.html", RequestContext(request, data) )


def _shared_context( request, corpus_name=None, active="" ):
	data = {}
	data['corpus'] = Corpus( id=request.session.get("corpus_id", 0), name=request.session.get("corpus_name", "") )
	data['active'] = active
	data['custom'] = CUSTOM_SETTINGS


	if data['corpus'].id == 0:
		corpora = Corpus.objects.filter( owners__user = request.user ).order_by("-id")
		if corpora.count() == 0:
			pass
			# first installation
			#corpus = get_object_or_404( Corpus, name='test', owner=request.user )
		else:
			corpus = corpora[0]
			data['corpus'] = corpus
			request.session["corpus_id"] = corpus.id
			request.session["corpus_name"] = corpus.name
	# load or switch corpus via corpus name
	# data['corpus'] = None
	#if corpus_name == None and data['corpus'].id == 0:
	#	corpus = Corpus.objects.filter( owners__user = request.user ).order_by("-id")[0]
	#	request.session["corpus_id"] = corpus.id
	#	request.session["corpus_name"] = corpus.name
	#	data['info'] = "session corpus created"
	#elif corpus_name != request.session.get("corpus_name", 0):
		# switch corpus
	#	data['corpus'] = get_object_or_404( Corpus, name=corpus_name, owner=request.user )
	#	request.session["corpus_id"] = data['corpus'].id
	#	request.session["corpus_name"] = data['corpus'].name
	#	data['info'] = "session corpus switched"

	#elif request.session.get("corpus_id", 0) is 0:
		# corpus_name is none, no session stored... load last corpus created
	#	try:
			# 
	#		corpus = Corpus.objects.filter( owners__user = request.user ).order_by("-id")[0]
	#		request.session["corpus_id"] = corpus.id
	#		request.session["corpus_name"] = corpus.name
	#		data['info'] = "session corpus created"
		
	#	except Exception, e:
	#		data['warning'] = "Exception: %s" % e
	#		request.session["corpus_id"] = 0
	#		request.session["corpus_name"] = ""

	
	#else:
	#	data['info'] = "session corpus already stored: %s" %corpus_name
		

	return data
