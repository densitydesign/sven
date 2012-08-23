# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext


def _init( request ):
	request.session['status'] = 'ok'
	request.session['user'] = request.user.username


def _throwerror( request, error ):
	_init( request );
	return _dropjson( request )

def _dropjson(request):
	data = {
		'status': request.session['status'],
		'user': request.session['user']
	}
	j = json.dumps( data, ensure_ascii=False )
	return HttpResponse( j, mimetype="text/plain" )
	
def index(request):
	_init( request )
	return _dropjson( request )
	
def notauthorized( request ):
	return _throwerror( request=request, error=error )