from datetime import datetime
from django.db.models import Q
from django.http import HttpResponse, HttpRequest, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import login, logout, authenticate

from sven.anta.forms import LoginForm
from sven.anta.models import *

CUSTOM_SETTINGS = {
	'STATIC_URL':'/static/',
	'LOGIN_URL':'/anta/login'
}

#@login_required( login_url=CUSTOM_SETTINGS['LOGIN_URL'] )
def list(request):
	data = {}
	data['custom'] = CUSTOM_SETTINGS
	c = RequestContext(request, data)
	return render_to_response("gui/list.html", c)