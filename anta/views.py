from datetime import datetime
from django.db.models import Q
from django.http import HttpResponse, HttpRequest, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import login, logout, authenticate

from sven.anta.forms import LoginForm
from sven.anta.models import *
from django.conf import settings

CUSTOM_SETTINGS = {
	'STATIC_URL': settings.ANTA_STATIC_URL if settings.ANTA_STATIC_URL else '/anta/static/',
	'LOGIN_URL':'/sven/anta/login',
}
LOGIN_REQUESTED_URL = CUSTOM_SETTINGS['LOGIN_URL']

@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def index(request):
	data = _data( request )
	data['sessiondata'] = request.COOKIES
	return render_to_response('anta/index.html', RequestContext(request, data))

#
# upload files. test.
#
@login_required( login_url=LOGIN_REQUESTED_URL )
def upload(request):
	data = _data( request )
	
	return render_to_response('anta/upload.html', RequestContext(request, data))

#
# force logout, then login
#
def login_view(request):
	data = _data( request )
	
	redirect_to = request.REQUEST.get( 'next', 'anta_index' )
	
	
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
	return render_to_response('anta/login.html', RequestContext(request, data))

def logout_view(request):
	data = _data( request )
	logout( request )
	data['loginform'] = LoginForm()
	return render_to_response('anta/login.html', RequestContext(request, data))
			

def _data( request ):
	data = { 'custom': CUSTOM_SETTINGS, 'preferences':{} }


	if request.user.is_authenticated():
		#load corpora associated
		data['corpora'] = Corpus.objects.filter(owners__user=request.user).all()
		
		# request.session["corpus_id"] = 3
		switch_corpus = request.REQUEST.get('switch-corpus',None)
		data['preferences']['info'] = switch_corpus
		
		if request.session.get("corpus_id", 0) is 0:
			# load corpus
			data['preferences']['info'] = "session corpus created"
			try:
				corpus = Corpus.objects.filter( owners__user = request.user ).order_by("-id")[0]
				request.session["corpus_id"] = corpus.id
				request.session["corpus_name"] = corpus.name
			except Exception, e:
				data['preferences']['info'] = "Exception: %s" % e
				request.session["corpus_id"] = 0
				request.session["corpus_name"] = ""
				
		elif switch_corpus is not None:
			data['preferences']['info'] = "session corpus switched"
			try:
				corpus = Corpus.objects.get( id=switch_corpus )
				request.session["corpus_id"] = corpus.id
				request.session["corpus_name"] = corpus.name
			except Exception, e:
				data['preferences']['info'] = "Exception: %s" % e
				request.session["corpus_id"] = 0
				request.session["corpus_name"] = ""

		data['preferences']['corpus_id'] = request.session["corpus_id"]
		data['preferences']['corpus_name'] = request.session.get("corpus_name", "")
	return data
	
