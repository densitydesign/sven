# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext

# local storage of objects, crossview
_data = {}

def _init( request ):
	_data[ 'status' ] = "ok"
	_data[ 'user' ] = request.user.username

def _throwerror( request, error ):
	_init( request );
	return _dropjson( request )

def _dropjson(request):
	j = json.dumps( _data, ensure_ascii=False )
	return HttpResponse( j, mimetype="text/plain" )
	
def index(request):
	_init( request )
	return _dropjson( request )
	
def notauthorized( request ):
	return _throwerror( request=request, error=error )