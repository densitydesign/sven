import tempfile
import shutil
import json

from datetime import datetime
from django.db.models import Q
from django.http import HttpResponse, HttpRequest, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import login, logout, authenticate

from sven.anta.forms import LoginForm
from sven.anta.models import *
from sven.anta.api import *

CUSTOM_SETTINGS = {
	'STATIC_URL':'/static/',
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
	data = {}
	data['custom'] = CUSTOM_SETTINGS
	data['active'] = "documents"
	#print document(request, id_document)
	if id_document != None:
		data['id_document'] = id_document
		c = RequestContext(request, data)
		return render_to_response("gui/document.html", c)
	else:
		c = RequestContext(request, data)
		return render_to_response("gui/documents.html", c)

# Timeline
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def timeline(request):
	data = {}
	data['active'] = "timeline"
	data['custom'] = CUSTOM_SETTINGS
	c = RequestContext(request, data)
	return render_to_response("gui/timeline.html", c)
	
	
# Dynamics
@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def dynamics(request):
	data = {}
	data['active'] = "dynamics"
	data['custom'] = CUSTOM_SETTINGS
	c = RequestContext(request, data)
	return render_to_response("gui/dynamics.html", c)
