from django.http import HttpResponse, HttpRequest
from django.utils import simplejson
import json,os, inspect
from django.forms import Form, IntegerField

from django.db.models.query import QuerySet, RawQuerySet

"""
Usage sample
	1. put this file inside your django app folder
	2. every model you would employ should have a json funciton defined returning a json friendly dictionary
	3. use your JsonQ! 

	sample pseudo view function

	def add_section( request, page_slug ):
		queryset = Bean.objects.all()
		return JsonQ( request ).get_response( queryset=queryset )
"""


#
#    ===================
#    ---- API CONST ----
#    ===================
#
API_DEFAULT_OFFSET = 0
API_DEFAULT_LIMIT = 50
API_AVAILABLE_METHODS = [ 'PUT', 'DELETE', 'POST', 'GET' ]
API_EXCEPTION				=	'GenericException'
API_EXCEPTION_DOESNOTEXIST	=	'DoesNotExist'
API_EXCEPTION_DUPLICATED	=	'Duplicated'
API_EXCEPTION_FORMERRORS	=	'FormErrors'
API_EXCEPTION_INCOMPLETE	=	'Incomplete'
API_EXCEPTION_EMPTY			=	'Empty'
API_EXCEPTION_INVALID		=	'Invalid'

#
#    ============================
#    ---- CUSTOM API HELPERS ----
#    ============================
#

def render_to_json( response, request=None ):
	if request is not None:
		if request.GET.__contains__("callback"):
			return HttpResponse( request.GET.get("callback") + "("+ json.dumps( response ) +")", mimetype="application/json")
	
	if request is not None and request.REQUEST.has_key('indent'):
		return HttpResponse( json.dumps( response, indent=4),  mimetype="text/plain")
	elif 'meta' in response and response['meta']['indent']:
		return HttpResponse( json.dumps( response, indent=4),  mimetype="text/plain")	
	return HttpResponse(json.dumps( response ), mimetype="application/json")


def throw_error( response={}, error="", code='',request=None ):
	response[ 'status' ] = 'error'
	response[ 'error' ] = error
	response[ 'code' ] = code
	return render_to_json( response, request)

class ApiMetaForm( Form ):
	offset	= IntegerField( min_value=0, required=False, initial=0 )
	limit	= IntegerField( min_value=1, max_value=100, required=False, initial=25 )


def is_number(s):
    s = s.replace("%", "")
    try:
        s = float(s)  # float() works iwth both integer-like and float-like strings.
    except ValueError:
        return False
    return True


def dictfetchall(cursor):
    "Returns all rows from a cursor as a dict"
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]

def _whosdaddy( level=2 ):
    return inspect.stack()[level][3]


#
#    =======================
#    ---- QUERYSET JSON ----
#    =======================
#
class JsonQ:
	"""
	Usage:
	
	queryset = Statistics.objects.filter( **kwargs )
	return JsonQ( request ).get_response( queryset=queryset )

	"""
	def __init__(self, request=None, data={},queryset=None, options={'require_auth':True} ):
		self.request = request
		self.data = data
		self.queryset = queryset
		self.options = options	

	def get_response(self,queryset=None,serialize_options={},options={}):
		self.options.update(options)
		if self.request is not None:
			if queryset is not None:
				self.queryset = queryset
				#Limit records to those authorized for request.user
				if self.options['require_auth'] == True:
					if hasattr(self.queryset.model, 'get_filter') and type(self.queryset) == QuerySet:
						self.queryset = self.queryset.filter(self.queryset.model.get_filter(self.request.user))
			self._process_request()
			self._process_data(serialize_options)
		else:
			self.response =  {"status":"ok"}
		
		return render_to_json(self.response)

	def _process_request(self):
		self.kwargs = {}
		r = self.request
		j =  {"status":"ok", 'meta':{ 'indent':False },'data':self.data, 'action':_whosdaddy(3) }
		j['meta']['version'] = '0.0.2'
		
		if r.REQUEST.has_key('indent'):
			j['meta']['indent'] = True
			self.kwargs['indent']=4
		form = ApiMetaForm( r.REQUEST )
		# get method
		if r.REQUEST.has_key('method'):
			j['meta']['method'] =  r.REQUEST.get('method')
		else:
			j['meta']['method'] = r.method
	
		if r.REQUEST.has_key('filters'):
			try:
				self.filters = j['meta']['filters'] = json.loads( r.REQUEST.get('filters') )
			except Exception, e:
				j['meta']['warnings'] = {'filters':"property 'filters' JSON Exception: %s" % e}
				self.filters = j['meta']['filters'] = {}
		else:
			self.filters = j['meta']['filters'] = {
												}
		
		if r.REQUEST.has_key('order_by'):
			try:
				self.order_by = j['meta']['order_by'] = json.loads( r.REQUEST.get('order_by') ) # json array
			except Exception, e:
				try:
					self.order_by =j['meta']['order_by'] = r.REQUEST.getlist('order_by')
				except Exception, e:
					j['meta']['warnings'] = "property 'order_by' JSON Exception: %s" % e
					self.order_by = j['meta']['order_by'] = []
		else:
			self.order_by = j['meta']['order_by'] = []
	
		# test against available methods, default with GET
		if not j['meta']['method']  in API_AVAILABLE_METHODS:
			j['meta']['method'] = 'GET'
			j['meta']['warnings'] = {'method':'default menthod GET applied, unhandled param "method" found in your request'}
		
		# expecting fields
		if j['meta']['method'] == 'POST':	
			self.fields = j['fields'] = json.loads( r.REQUEST.get('fields','') )
		
		if r.user is not None:
			j['user'] = r.user.username
		
		# offset, limit + next, prev like twitter 
		if j['meta']['method'] == 'GET':	
	
			if r.REQUEST.has_key('offset') or r.REQUEST.has_key('limit') :
				# check value
				if form.is_valid():
					self.offset = j['meta']['offset']	= form.cleaned_data['offset'] if form.cleaned_data['offset'] else API_DEFAULT_OFFSET 
					self.limit = j['meta']['limit']	= form.cleaned_data['limit'] if form.cleaned_data['limit'] else API_DEFAULT_LIMIT 
				else:
					self.offset = j['meta']['offset']	= API_DEFAULT_OFFSET 
					self.limit = j['meta']['limit']	= API_DEFAULT_LIMIT 
					j['meta']['errors']	= form.errors
			else:
				# default values
				self.offset = j['meta']['offset']	= API_DEFAULT_OFFSET
				self.limit = j['meta']['limit']	= API_DEFAULT_LIMIT 
			
			# next and prev like twitter, leverage inside their own view
			j['meta']['next'] = {
				'offset': j['meta']['offset'] + j['meta']['limit'],
				'limit':  j['meta']['limit']
			}
	
			if j['meta']['offset']	> 0:
				j['meta']['previous'] = {
					'offset': max( j['meta']['offset'] - j['meta']['limit'],  API_DEFAULT_OFFSET ),
					'limit': min( j['meta']['offset'],  j['meta']['limit'] )
				}
		self.response = j

	def _process_data(self,serialize_options={}):
		if self.queryset is not None:
				qs = self.queryset
				if type(self.queryset) == QuerySet:
					self.response['meta']['total_count'] = qs.filter(**self.filters).count()
					qs = self.queryset.filter(**self.filters ).order_by(*self.order_by)
				#Special exceptions for RawQuerySets (cannot filter, does not have count() method)
				elif type(self.queryset) == RawQuerySet:
					self.response['meta']['total_count'] = sum(1 for r in self.queryset)
				qs = qs[self.offset:self.offset+self.limit]
				# "easier to ask for forgiveness than permission" (EAFP) rather than "look before you leap" (LBYL)
				try:
					self.response['objects'] = [ o.json() for o in qs]
				except AttributeError:
					
					self.kwargs.update({'format':'python','queryset':qs})
					self.kwargs.update(serialize_options)
					self.response['objects'] = serializers.serialize(**self.kwargs)
				except Exception, e:
					self.response[ 'status' ] = 'error'
					self.response[ 'error' ] = "%s" % e
					self.response[ 'code' ] = API_EXCEPTION_INVALID