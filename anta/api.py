from django.http import HttpResponse, HttpRequest, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from sven.anta.models import *
from sven.anta.sync import store_document
from sven.core.utils import is_number

from django.conf import settings
from django.contrib.auth import login, logout
from django.core import serializers
from django.db import IntegrityError
from django.db.models import Q
from django.core.exceptions import FieldError
import os, json, datetime, operator, inspect
from sets import Set

from sven.anta.utils import *
from sven.anta.forms import ApiQueryForm,LoginForm, UpdateDocumentForm, TagForm, ApiMetaForm, ApiDocumentsFilter, ApiRelationForm, ApiCorpusForm
from django.contrib.auth.models import User
from django.db.models import Count, Min, Max, Avg
from django.template.defaultfilters import slugify

from sven.core.utils import _whosdaddy, render_to_json, throw_error, JsonQ
from sven.core.misc import Epoxy, grep, API_EXCEPTION_FIELDERROR, API_EXCEPTION_INTEGRITY
import urllib,logging, shutil


logger = logging.getLogger(__name__)
#
#    ========================
#    ---- JSON API CONST ----
#    ========================
#
API_LOGIN_REQUESTED_URL = '/api/login-requested'	 # needs to be logged in
API_ACCESS_DENIED_URL = '/api/access-denied'	 # needs to be logged in and th corpus should be cool
API_DEFAULT_OFFSET = 0
API_DEFAULT_LIMIT = 50
API_AVAILABLE_METHODS = [ 'PUT', 'DELETE', 'POST', 'GET' ]

API_EXCEPTION				=	'GenericException'
API_EXCEPTION_DOESNOTEXIST	=	'DoesNotExist'
API_EXCEPTION_DUPLICATED	=	'Duplicated'
API_EXCEPTION_FORMERRORS	=	'FormErrors'
API_EXCEPTION_INCOMPLETE	=	'Incomplete'
API_EXCEPTION_EMPTY			=	'Empty'
API_EXCEPTION_OSERROR		=	'OsError'
API_EXCEPTION_IOERROR		=	'IOError'
API_EXCEPTION_BADZIPFILE	=	'BadZipfile'


#
#    ==================================
#    ---- ASSISTANT JSON API VIEWS ----
#    ==================================
#

def index(request):
	response = _json( request )
	logger.warning('Something went wrong!')
	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def get_corpora(request):
	response = _json( request )
	response['objects']	= [ c.json() for c in Corpus.objects.all() ]
	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def get_corpus(request, corpus_id ):
	response = _json( request )
	
	try:
		response['corpus'] = Corpus.objects.get(name=corpus_id).json()
	except:
		response['corpus'] = None
		return throw_error( response, "corpus does not exist...")
	
	return render_to_json( response )


@login_required( login_url = API_LOGIN_REQUESTED_URL )
def relations( request ):
	response = _json( request )

	# create documents
	if response['meta']['method'] == 'POST':
		return create_relation( request, response )
	
	if 'corpus' in request.REQUEST:
		try:
			corpus = Corpus.objects.get(id=request.REQUEST.get('corpus'))
			response['corpus'] = corpus.json()	
		except Exception, e:
			return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )
		response['meta']['total'] = Relation.objects.filter( source__corpus__name=corpus, target__corpus__name=corpus).filter( **response['meta']['filters']).count()		
		response['results'] = [r.json() for r in Relation.objects.filter( source__corpus__name=corpus, target__corpus__name=corpus).filter( **response['meta']['filters']) [response['meta']['offset']:response['meta']['limit'] ]  ]
		return render_to_json( response )
	
	return _get_instances( request, response, model_name="Relation" )


@login_required( login_url = API_LOGIN_REQUESTED_URL )
def create_relation( request, response ):
	response['owner'] = request.user.json()
	form = ApiRelationForm( request.REQUEST )
	if form.is_valid():
		r = Relation( 
			source=form.cleaned_data['source'], target=form.cleaned_data['target'],
			polarity=form.cleaned_data['polarity'],description=form.cleaned_data['description'], 
			owner=request.user
		)
		r.save()
		response['created'] = r.json()
		return render_to_json( response )
	else:
		return throw_error( response, error=form.errors, code=API_EXCEPTION_FORMERRORS )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def relation( request, id ):
	response = _json( request )
	# all documents
	try:
		r =  Relation.objects.get(id=id)
	except Exception, e:
		return throw_error( response, "Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )	
	
	response['results'] = [r.json()]
	
	if response['meta']['method'] == 'DELETE':
		r.delete()		
		return render_to_json( response )

	# create documents
	if response['meta']['method'] == 'POST':
		## DOES NOT WORK. whiy? 
		form = ApiRelationForm( request.REQUEST, instance=r )
		
		if not form.is_valid():

			return throw_error( response, error=form.errors, code=API_EXCEPTION_FORMERRORS )	
		
		
		form.save(commit=False)
		r.creation_date = datetime.now()
		r.owner = request.user
		r.save()
		r = Relation.objects.get(pk=id)
		response['results'] = [r.json()]
		return render_to_json( response )

		# return create_relation( request, response )
	

	# if method is POST, update the relation
	"""
	if response['meta']['method'] == 'POST':
		form = UpdateDocumentForm( request.REQUEST )
		if form.is_valid():
			# save
			d.title = form.cleaned_data['title'] if len(form.cleaned_data['title'])>0 else d.title
			d.ref_date = form.cleaned_data['ref_date'] if form.cleaned_data['ref_date'] is not None else d.ref_date
			d.language = form.cleaned_data['language'] if len(form.cleaned_data['language'])>0 else d.language
			d.save()

		else:
			return throw_error( response, error=form.errors, code=API_EXCEPTION_FORMERRORS)
	"""
	
	return render_to_json( response )


#
#    =================
#    ---- CORPORA ----
#    =================
#	
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def corpora(request):
	response = Epoxy( request )
	
	if response.method == 'POST':
		return create_corpus( request, response )
	
	return response.queryset( Corpus.objects.filter( owner=request.user ) ).json()
	

def create_corpus( request, response ):
	response.add('owner', request.user, jsonify=True )
	
	form = ApiCorpusForm( request.REQUEST, initial={'owner':request.user.id} )
	if not form.is_valid():		
		return response.throw_error( error=form.errors, code=API_EXCEPTION_FORMERRORS ).json()

	corpus_path = response.add('corpus_path', os.path.join( settings.MEDIA_ROOT, slugify( os.path.basename( form.cleaned_data['name'] ) ) ) )

	#try:
		# create folder if does not exists
	if not os.path.exists( corpus_path ):
		os.makedirs( corpus_path )
	try:
		c = Corpus( name=slugify( form.cleaned_data['name'] ) )
		c.save()
		o = Owners( corpus=c, user=request.user )
		o.save()
	except IntegrityError, e:
		return response.throw_error( error=form.errors, code=API_EXCEPTION_INTEGRITY ).json()

	#except Exception, e:
	#	return throw_error( response, error="Exception: %s" % e, code="fault" )
	
	response.add('object', c, jsonify=True )
	return response.json()
	
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def corpus( request, corpus_id ):
	response = Epoxy( request )
	try:
		corpus = response.add('object', Corpus.objects.get(owner=request.user, id=corpus_id),jsonify=True)
	except Corpus.DoesNotExist,e:
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_DOESNOTEXIST ).json()
	
	if response.method == 'DELETE':
		corpus_path = os.path.join( settings.MEDIA_ROOT, corpus.name )
		shutil.rmtree( corpus_path )
		corpus.delete()
		# delete
		#
		pass
	
	return response.json()

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def corpus_download( request, corpus_id ):
	response = Epoxy( request )
	try:
		corpus = response.add('object', Corpus.objects.get(owner=request.user,id=corpus_id),jsonify=True)
	except Corpus.DoesNotExist,e:
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_DOESNOTEXIST ).json()

	corpus_path = os.path.join( settings.MEDIA_ROOT, corpus.name )

	zip_path = response.add("zip", "/tmp/sven_%s_%s.zip" % ( slugify(request.user.username), corpus.name )  )


	try:
		zipdir( corpus_path,  zip_path )
	except IOError, e:
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_IOERROR ).json()
	except OSError, e:
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_OSERROR ).json()
	except zipfile.BadZipfile, message:
		return  response.throw_error( error="%s" % e, code=API_EXCEPTION_BADZIPFILE ).json()
	
	response = HttpResponse( open( zip_path,'r' ).read(), content_type='application/zip') 
	response['Content-Disposition']='attachment;filename="%s"'% os.path.basename( zip_path )
	response['Content-length'] = os.stat( zip_path ).st_size
	return response
#
#    ==================
#    ---- DOCUMENTS----
#    ==================
# 
# csfr exempt should be used only in debug mode when your're lazy.	
# from django.views.decorators.csrf import csrf_exempt
# @csrf_exempt
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def documents(request, corpus_name=None):
	response = Epoxy( request )

	try:
		corpus = response.add('corpus', Corpus.objects.get( id=request.REQUEST.get('corpus') ), jsonify=True)
	except Corpus.DoesNotExist, e:
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_DOESNOTEXIST ).json()
	
	if response.method == 'POST':
		return create_document( request, response, corpus=corpus )

	# search query
	if 'q' in request.REQUEST:
		form = ApiQueryForm( request.REQUEST )

		if not form.is_valid():
			response.warning('query', form.errors )
		else:
			response.meta('query', request.REQUEST.get('q') )

		import glob
		

		corpus_path = os.path.join( settings.MEDIA_ROOT , corpus.name , "*.txt")
		matches = []
		grepper = re.compile( form.cleaned_data['q'] )
		#dual_name = re.compile()

		for i in glob.glob( corpus_path ):
			if grep( grepper, file(i)):
				if re.search( r'\..{3}\.txt$', i ):
					matches.append( os.path.basename( i )[:-4] )
				else:
					matches.append( os.path.basename( i ) )
		
				
		response.add('matches', matches )
		

		response.add('path', os.path.join( settings.MEDIA_ROOT , corpus.name) )

		return response.queryset( Document.objects.filter(corpus=corpus, url__in=matches) ).json()
		# apply grep as filter... :D
		# find . -type f -name "*.txt" -exec grep -zoc "class" {} +
		#args = ["find", os.path.join( settings.MEDIA_ROOT , corpus.name),"-type","f","-name","*.txt","-exec","grep", "-Ezoc" ,form.cleaned_data['q'],  "{}","+"]
		#response.add('script', " ".join( args ) )
		#try:
		#response.add('out', subprocess.check_output( args, stdin=subprocess.PIPE ))
		#except CalledProcessError, e:
		# error in argument list
		# except Exception, e:
			# python < 2.6 @todo handle exception Curella's way
		#	try:
		#		response.add('out', check_output(["tail", log_file]) )
		#	except Exception, e:
		#		return response.throw_error(error="Exception: %s" % e, code=API_EXCEPTION).json()
	



	return response.queryset( Document.objects.filter(corpus=corpus) ).json()

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def create_document( request, response, corpus ):

	# request files. cfr upload.html template with blueimp file upload
	if not request.FILES.has_key('files[]'):
		return response.throw_error( error="request.FILES['files[]'] was not found", code=API_EXCEPTION_INCOMPLETE ).json()
	

	path = os.path.join( settings.MEDIA_ROOT, corpus.name )
	logger.info( "start upload on path %s" % path)

	# uncomment to debug
	response.add('path', path)
	
	if not os.path.exists( path ):
		logger.error( "path %s does not exist!" % path)
		return response.throw_error( code=API_EXCEPTION_DOESNOTEXIST, error="path %s does not exits!" % path ).json()

	

	# check preloaded vars
	presets = None

	if request.REQUEST.get('language', None) is not None:
		logger.info( "'language' REQUEST param found, proceed to metadata validation")
			
		form = UpdateDocumentForm( request.REQUEST )
		if form.is_valid():
			presets = {}
			presets['language'] = form.cleaned_data['language']
			presets['ref_date'] = form.cleaned_data['ref_date']
			presets['title']	= form.cleaned_data['title']

			logger.info( "document metadata found, ref_date: %s" % presets['ref_date'] )
		
		else:
			return response.throw_error( code=API_EXCEPTION_FORMERRORS, error=form.errors ).json()
	
	
	# get tags
	if request.REQUEST.get('tags', None) is not None:
		if presets is None:
			presets = {}
		try:
			presets['tags'] = json.loads( request.REQUEST.get('tags') )
		except ValueError, e:
			return response.throw_error( "Exception: %s" % e, code=API_EXCEPTION ).json()

		for tag in presets['tags']:
			form = TagForm( tag )
			
			if form.is_valid():
				t = form.save()
			
			elif "__all__" in form.errors:
				try:
					t = Tag.objects.get( name=tag['name'], type=tag['type'] )
				except Exception, e:
					return response.throw_error( "Exception: %s" % e, code=API_EXCEPTION ).json()
			else:
				return response.throw_error( error=form.errors, code=API_EXCEPTION_FORMERRORS ).json()
			tag['id'] = t.id
	
	# append presets to response ( data, language, title and tags as django has understand them )
	response.add( 'presets', presets )


	# return response.json()	

	# response['uploads'] = []

	for f in request.FILES.getlist('files[]'):
		# store locally and save happily
		if f.size == 0:
			return response.throw_error( error="uploaded file is empty", code=API_EXCEPTION_EMPTY )
		
		# filename
		filename = os.path.join( path, f.name )

		# file exists. 
		# get permission to store the document. If it exists, will force override!
		try:
			destination = open( filename , 'wb+')
		except Exception, e:
			return response.throw_error( error="Exception: %s " % e, code=API_EXCEPTION_EMPTY).json()
		
		# save file
		for chunk in f.chunks():
			destination.write( chunk )
		
		destination.close()

		# save document
		try:
			d = store_document( filename=filename, corpus=corpus )
		except Exception, e:
			return response.throw_error( error="Exception: %s " % e, code=API_EXCEPTION_EMPTY ).json()

		# update with document form fileds above :D. Validation has already been done.
		if presets is not None:
			if presets['language'] is not None:
				d.language = presets['language'] 
			if presets['title'] is not None:
				d.title = presets['title'] 
			if presets['ref_date'] is not None:
				d.ref_date = presets['ref_date']
			d.save()
			
			if 'tags' in presets:
				for t in presets['tags']:	
					try:
						dt = Document_Tag( document=d, tag_id=t['id'] )
						dt.save()
					except IntegrityError:
						# relationship already exists
						continue
					except Exception, e:
						# strange exception!
						response.warning('document_tag',"Exception: %s" % e )
						continue
		
		response.add('upload', d, jsonify=True )
		logger.info("upload completed")
	return response.json()
	

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def document(request, document_id):
	response = _json( request )

	# create or update a document
	# @todo	

	d = _get_document( document_id )
	if d is None:
		return throw_error( response, "document %s does not exist..." % document_id, code=API_EXCEPTION_DOESNOTEXIST)
	
	# delete a document
	if response['meta']['method'] == 'DELETE':
		
		return _delete_instance( request, response, instance=d, attachments=[
			os.path.join(settings.MEDIA_ROOT, d.corpus.name, os.path.basename(d.url.url)),
			textify( d, settings.MEDIA_ROOT )
		])
        

	# if method is POST, update the document
	if response['meta']['method'] == 'POST':
		form = UpdateDocumentForm( request.REQUEST )
		if form.is_valid():
			# save
			d.title = form.cleaned_data['title'] if len(form.cleaned_data['title'])>0 else d.title
			d.ref_date = form.cleaned_data['ref_date'] if form.cleaned_data['ref_date'] is not None else d.ref_date
			d.language = form.cleaned_data['language'] if len(form.cleaned_data['language'])>0 else d.language
			d.save()

		else:
			return throw_error( response, error=form.errors, code=API_EXCEPTION_FORMERRORS )

	# load text only if it's required
	if request.REQUEST.has_key('with-text'):

		text = textify( d, settings.MEDIA_ROOT )
		
		if text is None:
			return throw_error( response, "unable to provide txt version of the document")
		
		response['text']	= open(text, 'r').read()
	
	# f = open( text, "r")
		
	response['results'] = [ d.json() ]
	
	return render_to_json( response )


#
#    ======================================
#    ---- TAGS, ACTORS & OTHER STORIES ----
#    ======================================
#
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def tags( request ):
	response = Epoxy( request )
	try:
		corpus = Corpus.objects.get( pk=request.REQUEST.get('corpus'))
	except Corpus.DoesNotExist,e:
		return response.throw_error(error="%s"%e,code=API_EXCEPTION_DOESNOTEXIST).json()

	return response.queryset(  Tag.objects.annotate(num_documents=Count("document__id", distinct=True)).filter( document__corpus=corpus ) ).json()
	

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def tag( request, tag_id ):
	queryset = Tag.objects.annotate(num_documents=Count("document__id", distinct=True)).filter( id=tag_id )
	return JsonQ( request ).get_response( queryset=queryset )
	

#
#    ==================
#    ---- SEGMENTS ----
#    ==================
#
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def segments_clean( request, corpus_id ):
	response = _json( request, enable_method=False )
	
	from distiller import start_routine

	try:
		c = Corpus.objects.get(pk=corpus_id)
		routine = start_routine( type='CLEAN', corpus=c )
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	# call a sub process, and pass the related routine id
	scriptpath = os.path.dirname(__file__) + "/metrics.py"

	return _start_process([ "python", scriptpath, '-r', str(routine.id), '-c', str(c.id), '-f', 'clean' ],
		routine=routine,
		response=response
	)
	



@login_required( login_url = API_LOGIN_REQUESTED_URL )
def segment_stems( request, corpus_id ):
	response = Epoxy( request )

	# split order_by stuff
	# order_by = ["tfidf DESC","tfidf ASC","distribution ASC", "distribution DESC"]
	basic_query = """
		SELECT 
			s.stemmed as content, s.id as sample, 
			AVG( ds.tfidf ) as avg_tfidf, MAX( ds.tfidf ) as max_tfidf, MIN( ds.tfidf ) as min_tfidf,
			AVG( ds.tf ) as avg_tf, MAX( ds.tf ) as max_tf, MIN( ds.tf ) as min_tf,
			COUNT( distinct ds.document_id ) as distribution,
			COUNT( distinct s.id ) as aliases FROM anta_segment s 
			JOIN anta_document_segment ds ON s.id = ds.segment_id
			JOIN anta_document d ON d.id = ds.document_id
		"""

	where = []
	binds = []


	try:
		corpus = response.add('corpus', Corpus.objects.get(owner=request.user, id=corpus_id) )
		where.append("d.corpus_id = %s")
		binds.append(corpus.id)
	except Corpus.DoesNotExist, e:
		return response.throw_error( error="%s", code=API_EXCEPTION_DOESNOTEXIST )

	order_by =  response.order_by if len( response.order_by ) > 0 else [ "distribution DESC", "avg_tfidf DESC",  "aliases DESC"]

	
	from django.db import connection
	try:
		cursor = connection.cursor()
		cursor.execute( " ".join([
			"""SELECT count(*) FROM ( SELECT COUNT(*) FROM anta_segment s 
				JOIN anta_document_segment ds ON s.id = ds.segment_id
				JOIN anta_document d ON d.id = ds.document_id""",
			"WHERE " + " AND ".join( where ) if len( where ) else "",
			"GROUP BY stemmed )"
		]), binds)
		(number_of_rows,) =cursor.fetchone()
		response.meta('total_count', number_of_rows)

		# build query
		query = [ basic_query,
			"WHERE " + " AND ".join( where ) if len( where ) else "",
			"GROUP BY stemmed",
			"ORDER BY " + ", ".join( order_by ) if len( order_by ) else "",
			""" LIMIT %s,%s """
		]
		response.add("query", " ".join( query ) )

		binds.append( response.offset )
		binds.append( response.limit )

		ss = Stem.objects.raw( " ".join( query ), binds )

		response.add('objects',[ s.json() for s in ss ] )
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )
	return response.json()

def segment_stem( request, segment_id, corpus_id ):
	response = Epoxy( request )
	try:
		corpus = response.add('corpus', Corpus.objects.get(owner=request.user, id=corpus_id),jsonify=True)
	except Corpus.DoesNotExist,e:
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_DOESNOTEXIST ).json()
	response.queryset( Segment.objects.filter( stemmed=Segment.objects.get(id=segment_id).stemmed ) )
	

	return response.json()



#
#    ==================
#    ---- SPECIALS ----
#    ==================
#	

#
#   Attach a corpus with the current user.
#   Warning! No restriction applied: every user can own every corpus.
#   @todo admin only, with a given corpus id and user_id
#
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def attach_corpus( request, corpus_id):
	response = _json( request, enable_method=False )
	corpus = _get_or_die("Corpus", response=response, filters={'id':corpus_id})
	
	# save 'ownership'
	_save_or_die( "Owners", response=response, filters={'corpus':corpus, 'user':request.user})
		
	response['corpus'] = corpus.json()
	response['corpus'] = corpus.json()
	response['user'] = request.user.json()

	return render_to_json( response )
	

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def use_corpus( request, corpus_id=None ):
	response = _json( request, enable_method=False )
	
	# response['objects'] = [c.json() for c in Corpus.objects.filter(owners__user=request.user) ]
	response['corpus'] = {}
	if request.session.get("corpus_id", 0) is 0:
		try:
			# last corpus created
			corpus = Corpus.objects.filter( owners__user = request.user ).order_by("-id")[0]
			request.session["corpus_id"] = corpus.id
			request.session["corpus_name"] = corpus.name
			response['info'] = "session corpus created"
		
		except Exception, e:
			response['warning'] = "Exception: %s" % e
			request.session["corpus_id"] = 0
			request.session["corpus_name"] = ""

	elif corpus_id is not None:
		try:
			corpus = Corpus.objects.get( id=corpus_id )
			request.session["corpus_id"] = corpus.id
			request.session["corpus_name"] = corpus.name
			response['info'] = "corpus stored in user's session"
		except Exception, e:
			response['warning'] = "Corpus in user's session vars unchanged. Exception: %s" % e
			#request.session["corpus_id"] = 0
			#request.session["corpus_name"] = ""
	else:
		response['info'] = "session corpus already stored"


	response['corpus']['id'] = request.session["corpus_id"]
	response['corpus']['name'] = request.session.get("corpus_name", "")

	return render_to_json( response )
		

def _load_corpus( request, response, corpus_id=None ):
	"""
	view helper: load a single corpus from request.
	If no corpus is found, it retrieves the session corpus for the given user
	"""
	response['corpus'] = {}

	if request.session.get("corpus_id", 0) is 0:
		try:
			# last corpus created
			corpus = Corpus.objects.filter( owners__user = request.user ).order_by("-id")[0]
			request.session["corpus_id"] = corpus.id
			request.session["corpus_name"] = corpus.name
			response['info'] = "session corpus created"
		
		except Exception, e:
			response['warning'] = "Exception: %s" % e
			request.session["corpus_id"] = 0
			request.session["corpus_name"] = ""

	elif corpus_id is not None:
		try:
			corpus = Corpus.objects.get( id=corpus_id )
			request.session["corpus_id"] = corpus.id
			request.session["corpus_name"] = corpus.name
			response['info'] = "corpus stored in user's session"
		except Exception, e:
			response['warning'] = "Corpus in user's session vars unchanged. Exception: %s" % e
			#request.session["corpus_id"] = 0
			#request.session["corpus_name"] = ""
	else:
		response['info'] = "corpus from session vars"

	# validate session vars


	response['corpus']['id'] = request.session["corpus_id"]
	response['corpus']['name'] = request.session.get("corpus_name", "")
	return response['corpus']

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def attach_free_tag( request, document_id ):
	"""
	This function requires name and type given as args
	"""
	response = _json( request, enable_method=False )
	
	try:
		d = Document.objects.get(pk=document_id)
	except Exception, e:
		return throw_error( response, "Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	
	# add new tag form
	form = TagForm( request.REQUEST )
	if form.is_valid():
		t = form.save()
	elif "__all__" in form.errors:
		try:
			t = Tag.objects.get(name=request.REQUEST.get('name',None),type=request.REQUEST.get('type', None) )
		except Exception, e:
			return throw_error( response, "Exception: %s" % e, code=API_EXCEPTION_DUPLICATED )
	else:
		return throw_error( response, error=form.errors, code=API_EXCEPTION_FORMERRORS )

	# save relationship
	try:
		dt = Document_Tag( document=d, tag=t )
		dt.save()
	except:
		return throw_error( response, error="Relationship document tag already existing", code=API_EXCEPTION_DUPLICATED )

	# auto load relations
	response['results'] = [ d.json() ]
	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def attach_tag( request, document_id, tag_id ):
	response = _json( request, enable_method=False )
	try:
		d = Document.objects.get(pk=document_id)
	except Exception, e:
		return throw_error( response, "Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	try:
		dt = Document_Tag( document=d, tag=Tag.objects.get(pk=tag_id))
		dt.save()
	except Exception, e:
		return throw_error( response, "Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	# load document

	response['results'] = [ d.json() ]
	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def detach_tag( request, document_id, tag_id ):
	response = _json( request, enable_method=False )
	try:
		d = Document.objects.get(pk=document_id)
	except Exception, e:
		return throw_error( response, "Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	try:
		Document_Tag.objects.get( document=d, tag__id=tag_id).delete()
	except Exception, e:
		return throw_error( response, "Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	# load document
	response['results'] = [ d.json() ]
	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def tfidf( request, corpus_id ):
	"""
	START the classic tfidf extraction. 
	Open related sub-process with routine id.
	Return the routine created.
	"""
	from distiller import start_routine, stop_routine
	import subprocess, sys

	response = Epoxy( request )

	# _json( request, enable_method=False )
	
	try:
		c = Corpus.objects.get(pk=corpus_id)
	except Corpus.DoesNotExist, e:
		return throw_error( response, error="%s" % e, code=API_EXCEPTION_DOESNOTEXIST )
	
	routine = response.add('object', start_routine( type='TFIDF', corpus=c ), jsonify=True )

	logger.info('[%s:%s] TFIDF request via api' % ( c.name, c.id ) )
		
	if routine.status == Routine.START:


		logger.info('[%s:%s] TFIDF subprocess.Popen' % ( c.name, c.id ) )
		# call a sub process, and pass the related routine id
		scriptpath = os.path.dirname(__file__) + "/metrics.py"
	
		subprocess.Popen([ "python", scriptpath, '-r', str(routine.id), '-c', str(c.id), '-f', 'standard' ], stdout=None, stderr=None)
	
	return response.json()

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def update_tfidf( request, corpus_id ):
	response = _json( request, enable_method=False )
	
	from distiller import start_routine

	try:
		c = Corpus.objects.get(pk=corpus_id)
		routine = start_routine( type='RELTF', corpus=c )
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	# call a sub process, and pass the related routine id
	scriptpath = os.path.dirname(__file__) + "/metrics.py"

	return _start_process([ "python", scriptpath, '-r', str(routine.id), '-c', str(c.id), '-f', 'tf_tfidf' ],
		routine=routine,
		response=response
	)

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def update_similarity( request, corpus_id ):
	response = _json( request, enable_method=False )
	
	from distiller import start_routine

	try:
		c = Corpus.objects.get(pk=corpus_id)
		routine = start_routine( type='RELSy', corpus=c )
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	# call a sub process, and pass the related routine id
	scriptpath = os.path.dirname(__file__) + "/metrics.py"

	return _start_process([ "python", scriptpath, '-r', str(routine.id), '-c', str(c.id), '-f', 'similarity' ],
		routine=routine,
		response=response
	)


# !! DEP. @deprecated:
def start_metrics( request, corpus_id):
	from utils import pushdocs
	from ampoule import decant
	response = _json( request, enable_method=False )
	
	
	c =  _get_corpus( corpus_id )
	
	if c is None:
		# do sync
		return throw_error( response, "Corpus %s does not exist...," % corpus_id, code=API_EXCEPTION_DOESNOTEXIST )	
	
	# standard analysis includes: metrics
	a = _store_analysis( corpus=c, type="ST" )

	# pushdocs
	try:
		a = pushdocs( corpus=c, analysis=a, path=settings.MEDIA_ROOT+c.name)
	except Exception,e:
		a.status = "ERR"
		a.save()
		return throw_error( response, "Exception: %s " % e, code=API_EXCEPTION_DOESNOTEXIST )	
	
	if a.status == "OK":
		# launch tf stuffs and wait
		#try:
		decant( c.name )
		#subprocess.check_call("python ampoule.py -c %s > /tmp/log.txt" + c.name, shell=False)
		#except Exception, e:
		#	return throw_error( response, "Exception: %s " % e, code=API_EXCEPTION_DOESNOTEXIST )	
	
	# launch tfidf stuff



	# do sync
	response['analysis'] = a.json()
	return render_to_json( response )

def start_alchemy(request, corpus):
	pass

def d3_streamgraph( request, corpus_id ):
	from django.db import connection

	response = Epoxy( request )

	# query 1: get corpus
	try:
		corpus = response.add( 'corpus', Corpus.objects.get(id=corpus_id), jsonify=True )
	except Corpus.DoesNotExist,e:
		return response.throw_error( error="%s"%e,code=API_EXCEPTION_DOESNOTEXIST).json()

	# if user has filter selected
	if len(response.filters):
		# query 2: filter documents by user filters
		documents = response.add('ids',[ str(d.id) for d in Document.objects.filter(corpus=corpus).filter( **response.filters )])
		if len( documents ) == 0:
			response.warning('filters','no documents matches given query')
			response.add( 'objects',[])
			return response.json()

		actors = [{'name':t.name,'id':t.id } for t in Tag.objects.filter( type='actor', document__in= documents ) ]
		# query 3: get actors name for the given corpus
		
	else:	
		documents = None
		actors = [{'name':t.name,'id':t.id } for t in Tag.objects.filter( type='actor', document__corpus__id= corpus_id ) ]

	# query 4. a Limited number of concepts ( first 3 concepts per actor )
	cursor = connection.cursor()
	query = response.meta( 'query', """
		SELECT 
	    	s.stemmed as concept, MAX(ds.tfidf) as max_tfidf, AVG(tf) as avg_tf,
			count( DISTINCT ds.document_id ) as distribution,
			MAX(tf) as max_tf
		FROM `anta_document_segment` ds
			JOIN anta_segment s ON s.id = ds.segment_id
			JOIN anta_document d ON d.id = ds.document_id

		WHERE d.corpus_id = %s AND s.status = %s """ +
		(" AND d.id IN ( %s )" % ",".join(documents) if documents is not None else "")
		+ """ 
		GROUP BY stemmed
		ORDER BY """ + (", ".join( response.order_by ) if len( response.order_by ) > 0 else "max_tfidf DESC") + """
		LIMIT %s, %s
		""")

	cursor.execute(
		query
		, [corpus_id, 'IN', response.offset, response.limit ])

	objects = []
	
	for row in cursor.fetchall():
		objects.append({
			'key': row[ 0 ], # the concept alias stemmed group
			'tfidf': row[ 1 ], # max tfidf
			'tf': row[ 2 ], # avg tf
			'values': dict([( a['id'], { 'step':a['name'], 'value':0.0 } ) for a in actors ])
		})
	

	# query 2. concept per actor
	cursor = connection.cursor()
	cursor.execute(
		"""
		SELECT 
			s.stemmed as concept, t.id, MAX( ds.tfidf ) as max_tfidf, MAX( ds.tf ) as max_tf, t.name,
			s.content
		FROM `anta_document_segment` ds
			JOIN anta_segment s ON s.id = ds.segment_id
			JOIN anta_document d ON d.id = ds.document_id
			JOIN anta_document_tag dt ON d.id = dt.document_id
			JOIN anta_tag t ON t.id = dt.tag_id
		WHERE d.corpus_id = %s AND s.status = %s and t.type='actor' """ + 
		(" AND d.id IN ( %s )" % ",".join(documents) if documents is not None else "")
		+ """
		GROUP BY concept, t.id
		""", [corpus_id, 'IN' ]
	)

	concepts = {}
	for row in cursor.fetchall():
		c = row[0] # stemmed
		t = row[ 1 ] # actor id
		if c not in concepts:
			concepts[ c ] = {}
		concepts[ c ][ t ] = { 'tf': row[ 3 ], 'tfidf': row[ 2 ], 'label' : row[ 5 ] }

	res = []
	for i, o in enumerate(objects):
		c = objects[ i ][ 'key' ] 
		
		
		for t in o[ 'values' ]:
			if t in concepts[ c ]:
				objects[ i ][ 'values' ][ t ][ 'value' ] = concepts[ c ][ t ][ 'tf' ]
				objects[ i ][ 'values' ][ t ][ 'labels' ] = concepts[ c ][ t ][ 'label' ]
				objects[ i ][ 'values' ][ t ][ 'tfidf' ] = concepts[ c ][ t ][ 'tfidf' ]
		objects[ i ][ 'values' ] = objects[ i ][ 'values'].values()

	response.add('objects', objects )
	#response.add('concepts', concepts )
	return response.json()

def streamgraph( request, corpus_id ):
	response = _json( request )
	c = _get_corpus( corpus_id )
	if c is None:
		return throw_error( response, "Corpus %s does not exist...," % corpus_id, code=API_EXCEPTION_DOESNOTEXIST )	
	from django.db import connection

	filters = ""
	if "filters" in response['meta']:
		ids = [ str(d.id) for d in Document.objects.filter(corpus__id=corpus_id,**response['meta']['filters'])]
		if len(ids) > 0:
			filters = " AND d.id IN ( %s )" % ",".join(ids)
		else:
			response['meta']['total'] = 0;
			response['actors'] = {}
			return render_to_json( response )
	query = """
		SELECT 
	    	t.name,  s.stemmed as concept, MAX(ds.tfidf) as max_tfidf, AVG(tf),
			count( DISTINCT s.id ) as distro 
		FROM `anta_document_segment` ds
			JOIN anta_segment s ON s.id = ds.segment_id
			JOIN anta_document d ON d.id = ds.document_id
			JOIN anta_document_tag dt ON dt.document_id = ds.document_id 
			JOIN anta_tag t ON t.id = dt.tag_id 
			
		WHERE d.corpus_id = %s """ + filters + """ AND t.type='actor'
		GROUP BY t.id, concept HAVING max_tfidf > 0.001 ORDER BY max_tfidf DESC, `distro` DESC
		"""
	response['query'] = query
	cursor = connection.cursor()
	cursor.execute( query, [corpus_id]
	)

	response['actors'] = {}
	i = 0
	for row in cursor.fetchall():
		if row[0] not in response['actors']:
			response['actors'][ row[0] ] = []

		if len(response['actors'][ row[0] ]) > 14:
			continue

		response['actors'][ row[0] ].append({
			'concept':row[1],
			'tfidf':row[2],
			'tf':row[3],
			'f':row[4]
		})
		i += 1

	response['meta']['total'] = i;

	return render_to_json( response )


def relations_graph(request, corpus_id):
	response = Epoxy( request )
	
	# get the corpus
	try:
		c = response.add('corpus', Corpus.objects.get( id=corpus_id ), jsonify=True )
	except Corpus.DoesNotExist, e:
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_DOESNOTEXIST ).json()
	
	# 1. BASIC filters for django queryset
	filters = ["d1.corpus_id=%s", "d2.corpus_id=%s"]
	ids = []

	# 1. handle filters via get,just documents id

	try:
		ids = [ str(d.id) for d in Document.objects.filter(corpus=c).filter(**response.filters) ]
	except FieldError, e:
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_FIELDERROR ).json()
	
	response.add('documents_filtered',ids)

	
	# 2. validate length
	if len(ids) == 0:
		response.meta("total_count",0)
		response.add('nodes', {})
		response.add('edges', {})
		return response.json()
	
	

	# 3. add some basic filters
	# filters.append( "t1.id != t2.id")
	filters.append( "t1.type='actor'" ) # filter by tag type actor
	filters.append( "t2.type='actor'" ) 
	filters.append( "d1.id IN ( %s )" % ",".join(ids) )
	filters.append( "d2.id IN ( %s )"  % ",".join(ids) )
	
	
	# 3.5. filter edges? min similarity == 0
	try:
		min_cosine_similarity = float( request.REQUEST.get('min-cosine-similarity', "0.0" ) )
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_FORMERRORS )



	edges = {}
	candidates = {}
	shared_documents = {}

	# 4. load ALL actors as nodes
	actors = Document_Tag.objects.filter(tag__type='actor', document__id__in=ids)
	


	for dt in actors:
		
		if dt.document.id not in shared_documents:
			shared_documents[ dt.document.id ] = []
		shared_documents[ dt.document.id ].append( dt.tag.id )

		if dt.tag.id not in candidates: 
			candidates[ dt.tag.id ] = {
				'size': 0,
				'name':dt.tag.name,
				'id':dt.tag.id,
				'docs':[]
			}
		candidates[ dt.tag.id]['size'] = candidates[ dt.tag.id]['size'] + 1
		candidates[ dt.tag.id]['docs'].append( dt.document.id )


	actors_involved = []

	#
	# 6. MANUAL RELATIONS edges ( intensity points )
	#
	relations = Relation.objects.filter( source__id__in=ids , target__id__in=ids )
	for r in relations:
		sa = r.source.tags.filter(type='actor')
		ta = r.target.tags.filter(type='actor')
		for a in sa:
			
			for t in ta:
				if t.id == a.id:
					continue
				
				actors_involved.append( a.id )
				actors_involved.append( t.id )

				# calculate average here
				edge = " ".join( sorted([ str(t.id), str( a.id)]) )
				actors_involved.append( t.id )
				if edge not in edges:
					edges[ edge ] ={
						'source':t.id,
						'target':a.id,
						'value':0,
						'sum':0,
						'components': 0,
						'color':'#383838' # black is neuter
					}
				edges[ edge ]['components'] = edges[ edge ]['components'] + 1
				edges[ edge ]['sum'] = edges[ edge ]['sum'] + r.intensity()
	
	for e in edges.keys():
		edges[ e ]['value'] = edges[ e ]['sum'] / edges[ e ]['components']
		edges[ e ]['color'] = Relation.intensity_as_color(value=edges[ e ]['value'],min=0, max=1)
		if edges[ e ][ 'value' ] < 0.5 and (1 - edges[ e ][ 'value' ] * 2) < min_cosine_similarity:
			# negative connection
			del edges[e]
			# rescale based on similarity value
			
		elif edges[ e ][ 'value' ] > 0.5 and ( edges[ e ][ 'value' ] - 0.5 ) < (min_cosine_similarity/2):
			del edges[e]
		

	#
	# 7. SIMILARITY DISTANCE edges
	#		
	from django.db import connection
	cursor = connection.cursor()
	cursor.execute("""
		SELECT 
		    t1.id as alpha_actor,  
		    t2.id as omega_actor,
		    AVG( y.cosine_similarity ) as average_cosine_similarity,
		    MIN( y.cosine_similarity ) as min_cosine_similarity,
		    MAX( y.cosine_similarity ) as max_cosine_similarity,
		    COUNT( distinct t2.id ) as alpha_size
		FROM `anta_distance` y
		JOIN anta_document_tag dt1 ON y.alpha_id = dt1.document_id
		JOIN anta_document_tag dt2 ON y.omega_id = dt2.document_id  
		JOIN anta_tag t1 ON dt1.tag_id = t1.id
		JOIN anta_tag t2 ON dt2.tag_id = t2.id
		JOIN anta_document d1 ON y.alpha_id = d1.id
		JOIN anta_document d2 on y.omega_id = d2.id
			WHERE 
		    """ + " AND ".join( filters ) +  """
		
		GROUP BY alpha_actor, omega_actor 
			""" + ( " HAVING min_cosine_similarity > %s " % min_cosine_similarity if min_cosine_similarity > 0 else "" ) + """
		ORDER BY average_cosine_similarity
	""",[ corpus_id, corpus_id])

	for row in cursor.fetchall():
		alpha_actor = row[0]
		omega_actor = row[1] 
		size  = row[5] 
		
		if alpha_actor == omega_actor:
			continue
		actors_involved.append( alpha_actor )
		actors_involved.append( omega_actor )

		edge = " ".join( sorted([ str( alpha_actor), str( omega_actor)]) )
		if edge not in edges:
			edges[ edge ] = {
				'value':row[2],
				'source': alpha_actor,
				'target': omega_actor,
				'color': '#ffffff'
			};
		else:
			# substitute value with similarity
			edges[ edge ]['value'] = ( edges[ edge ]['value'] + row[2] ) / 2

	#
	# 5. SHARED ACTORS LINKS ( +1% points)
	#
	#for d in shared_documents:
	#	if len( shared_documents[d] ) < 2:
	#		continue

	#	for i in range( len( shared_documents[d] ) ):
	#		for j in range( i + 1 ):
	#			if i == j:
	#				continue
				# has_key? add points? 
	#			edge = " ".join( sorted([ str(  shared_documents[d][i] ), str( shared_documents[d][j]) ]) )
	#			if edge not in edges:
	#				edges[ edge ] = {
	#					'source': shared_documents[d][i],
	#					'target': shared_documents[d][j],
	#					'value':  0.01,
	#					'color':  '#cccccc'
	#				}
	nodes = []
	actors_involved = list( Set( actors_involved ) )
	#for n in actors_involved:
	#	nodes.append( candidates[ actors_involved[n] ] )
	for n in actors_involved:
		nodes.append( candidates[ n ] )

	# response.add('actors_involved', actors_involved ) #actors_involved

	response.add('nodes', nodes )
	response.add('edges', edges.values() )
	
	return response.json()


def download_document(request, document_id):
	
	d = _get_document( document_id )
	if d is None:
		return throw_error( _json( request, enable_method=False ), "dcument does not exist...")
	response = _json( request, enable_method=False )
	
	filename = settings.MEDIA_ROOT + d.corpus.name + "/" + os.path.basename( d.url.path )
	response['filename'] = os.path.basename(filename)
	
	if not os.path.exists( filename ):
		return throw_error( _json( request, enable_method=False ), "dcument does not exist...")
	
	#return render_to_json( response )
	
	response = HttpResponse( open( filename,'r' ).read(), content_type=d.mime_type) 
	response['Content-Disposition']='attachment;filename="document_%s"'%d.id
	response['Content-length'] = os.stat( filename ).st_size
	return response


def pending_routine_corpus( request, corpus_id ):
	response = _json( request )
		
	try:	
		response['objects'] = [ a.json() for a in Routine.objects.filter( corpus__id = corpus_id ).order_by( "-id" )[  response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	except Exception, e:
		return throw_error( response, error="Exception thrown: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )	
	
	return  render_to_json( response )


def pending_analysis_corpus( request, corpus_id ):
	response = _json( request )
		
	try:	
		response['objects'] = [ a.json() for a in Analysis.objects.filter( corpus__id = corpus_id, end_date = None ).order_by( "-id" )[  response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	except Eception, e:
		return throw_error( response, error="Exception thrown: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )	
	
	return  render_to_json( response )


def segments_export( request, corpus_id ):
	try:
		c = Corpus.objects.get( id=corpus_id, owner=request.user )
	except Corpus.DoesNotExist, e:
		response = Epoxy(request)
		return response.throw_error( error="%s" % e, code=API_EXCEPTION_DOESNOTEXIST ).json()
	
	import unicodecsv
	ss = Segment.objects.raw("""
		SELECT 
			s.`id`, s.`content`,s.`language`, 
			s.`stemmed`, s.`status`, 
			MAX( ds.`tfidf`) AS `max_tfidf`,
			MAX( ds.`tf`) AS `max_tf`, 
			COUNT( DISTINCT ds.document_id) AS `distro` 
		FROM anta_segment s
			JOIN anta_document_segment ds ON s.id = ds.segment_id 
			JOIN anta_document d ON ds.document_id = d.id
		WHERE d.corpus_id = %s
		GROUP BY s.stemmed
		""",[corpus_id]
	) 
	
	if 'plain-text' not in request.REQUEST:
		response = HttpResponse(mimetype='text/csv; charset=utf-8')
		response['Content-Description'] = "File Transfer";
		response['Content-Disposition'] = "attachment; filename=%s.csv" % c.name 
	
	else:
		response = HttpResponse(mimetype='text/plain; charset=utf-8')
	writer = unicodecsv.writer(response, encoding='utf-8')
	
	# headers	
	writer.writerow(['segment_id', 'content', 'concept',  'distribution', 'status', 'max_tf', 'max_tfidf'])

	for s in ss:
		writer.writerow([  s.id, s.content, s.stemmed, s.distro, s.status, s.max_tf, s.max_tfidf])
	
	return response

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def segments_import( request, corpus_id ):
	response = _json( request,  enable_method=False )
	path = "/tmp/"
	
	# uncomment to debug
	response['path'] = path
	
	if not os.path.exists( path ):
		return throw_error(response, code=API_EXCEPTION_DOESNOTEXIST, error="path %s does not exits!" % path )

	try:
		c = Corpus.objects.get(pk=corpus_id)
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	response['uploads'] = []

	# request files. cfr upload.html template with blueimp file upload
	if not request.FILES.has_key('csv[]'):
		return throw_error( response, error="request.FILES['csv[]'] was not found", code=API_EXCEPTION_INCOMPLETE)
	
	for f in request.FILES.getlist('csv[]'):
		# store locally and save happily
		if f.size == 0:
			return throw_error(response, error="uploaded file is empty", code=API_EXCEPTION_EMPTY)
		
		# filename
		filename = path + "sven.import.csv" 

		# get permission to store the document. If it exists, will force override!
		try:
			destination = open( filename , 'wb+')
		except Exception, e:
			return throw_error( response, error="Exception: %s " % e, code=API_EXCEPTION_EMPTY)
		
		# save file
		for chunk in f.chunks():
			destination.write(chunk)
			destination.close()

		"""
		IMPORT SEGMETS metrics.py
		"""
		from distiller import start_routine, stop_routine
		import subprocess, sys

		
		routine = start_routine( type='IMPORT', corpus=c )
		if routine is None:
			throw_error( response, error="A very strange error", code=API_EXCEPTION_EMPTY)

		# call a sub process, and pass the related routine id
		scriptpath = os.path.dirname(__file__) + "/metrics.py"
		response['routine'] = routine.json()
	
		try:
			subprocess.Popen([ "python", scriptpath, '-r', str(routine.id), '-c', str(c.id), '-f', 'importcsv', '-x', filename, '-d',"," ], stdout=None, stderr=None)
		except Exception, e:
			return throw_error(response, error="Exception: %s" % e, code=API_EXCEPTION)
		return render_to_json( response )



		response['uploads'] = filename;
	
	return  render_to_json( response )

#
#    ======================
#    ---- OTHER STUFFS ----
#    ======================
#
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def log_tail( request ):
	response = _json( request )
	import subprocess, sys

	log_file = settings.LOGGING['handlers']['anta']['filename']
	
	try:
		response['out'] = subprocess.check_output(["tail", log_file])
	except Exception, e:
		try:
			response['out'] = check_output(["tail", log_file])
		except Exception, e:
			return throw_error(response, error="Exception: %s" % e, code=API_EXCEPTION)
	

	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def log_test(request):
	response = _json( request )
	logger.info("Welcome to ANTA logger. Everything seems to work fine.")
	return log_tail( request )

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
#    Intended for api internal use only.
#
def _start_process( popen_args, routine, response ):
	import subprocess, sys

	response['routine'] = routine.json()

	try:
		subprocess.Popen(popen_args, stdout=None, stderr=None)
	except Exception, e:
		return throw_error(response, error="Exception: %s" % e, code=API_EXCEPTION)
	
	return render_to_json( response )

def zipdir(folder_path, output_path):
	import zipfile
	"""Zip the contents of an entire folder (with that folder included
	in the archive). 

	Empty subfolders will be included in the archive as well.
	"""
	parent_folder = os.path.dirname(folder_path)
	# Retrieve the paths of the folder contents.
	contents = os.listdir(folder_path)
	try:
		zip_file = zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED)
		for file_name in contents:
			absolute_path = os.path.join(folder_path, file_name)
			relative_path = os.path.basename( file_name )
			zip_file.write(absolute_path, relative_path)
		return output_path
	except IOError, message:
		raise
	except OSError, message:
		raise
	except zipfile.BadZipfile, message:
		raise
	finally:
		zip_file.close()

def check_output(*popenargs, **kwargs):
	import subprocess
	r"""Run command with arguments and return its output as a byte string.

	Backported from Python 2.7 as it's implemented as pure python on stdlib.

	>>> check_output(['/usr/bin/python', '--version'])
	Python 2.6.2
	"""
	process = subprocess.Popen(stdout=subprocess.PIPE, *popenargs, **kwargs)
	output, unused_err = process.communicate()
	retcode = process.poll()
	if retcode:
		cmd = kwargs.get("args")
		if cmd is None:
			cmd = popenargs[0]
		error = subprocess.CalledProcessError(retcode, cmd)
		error.output = output
		raise error
	return output


def _delete_instance( request, response, instance, attachments=[] ):
	
	try:
		instance.delete();
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_EMPTY )
	
	for f in attachments:
		if f:
			try:
				os.remove(urllib.unquote_plus(str(f)));
			except Exception, e:
				return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_EMPTY )
		
	return render_to_json( response );
	
def _get_instances( request, response, model_name, app_name="anta" ):
	from django.db.models.loading import get_model
	
	m = get_model(app_name,model_name)
	
	# get toal objects
	response['meta']['total'] = m.objects.count()
	
	try:
		# has OR clause (does not handle filters )
		if response['meta']['queries'] is not None:
			#queries = reduce(operator.or_, [Q(x) for x in response['meta']['queries']])
			#response['results'] = [i.json() for i in m.objects.filter( queries, **response['meta']['filters']).order_by(*response['meta']['order_by'])[ response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
			
			pass

		response['results'] = [i.json() for i in m.objects.filter( **response['meta']['filters']).order_by(*response['meta']['order_by'])[ response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_EMPTY )
		
	return render_to_json( response )
	#.objects.all()

#
#   Usage: corpus = get_or_die("Corpus", response, {'id':2})
#
def _get_or_die( model_name, response, app_name="anta", filters={}):
	from django.db.models.loading import get_model
	m = get_model(app_name,model_name)
	try:
		return m.objects.get( **filters ) 
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_EMPTY )

#
#   Usage: corpus = get_or_die("Corpus", response, {'id':2})
#
def _save_or_die( model_name, response, app_name="anta", filters={}):
	from django.db.models.loading import get_model
	m = get_model(app_name,model_name)
	try:
		return m( **filters ).save()
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_EMPTY )


def _store_analysis( corpus, type=""):
	try:
		# check if analysis exists
		analysis = Analysis.objects.get(corpus=corpus, type=type)
		
		# close and create a brand new analysis only if status = ERR | OK
		if analysis.status == "ERR":
			# if error analysis failed: then close current analysis and start a brand new analysis
			analysis.status = "RIP" # rest in peace
			if not analysis.end_date:
				analysis.end_date = datetime.now()
			analysis.save()
			analysis = Analysis( corpus=corpus, type=type, start_date=datetime.now(), status="CRE" )
			analysis.save() # create a brand new
			
		elif analysis.status == "OK":
			# analysis finished. Is it necessary to force restart?
			analysis.status = "RET" # retired.
			analysis.save()
			analysis = Analysis( corpus=corpus, type=type, start_date=datetime.now(), status="CRE" )
			analysis.save()	# create a brand new one

		# analysis is running...
		return analysis 		

	except Analysis.DoesNotExist:
		analysis = Analysis( corpus=corpus, type=type, start_date=datetime.now(), status="CRE" )
		analysis.save()
	except:
		analysis = Analysis.objects.filter(corpus=corpus, type=type)[0]
	return analysis

def _get_corpus( corpus_id ):
	# given a corpus name return None or a corpus object
	try:
		c = Corpus.objects.get(id=corpus_id)
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

def _get_relation( relation_id ):
	# given a relation id return None or the related Relation object
	try:
		r = Relation.objects.get(id=relation_id)
		return r
	except:
		return None


def _json( request, enable_method=True ):
	j =  {"status":"ok", 'meta':{ 'indent':False, 'action':_whosdaddy() } }
	if request.REQUEST.has_key('indent'):
		j['meta']['indent'] = True

	if request.user is not None:
		j['user'] = request.user.username
	
	if enable_method == False:
		return j

	form = ApiMetaForm( request.REQUEST )
	# get method
	if request.REQUEST.has_key('method'):
		j['meta']['method'] =  request.REQUEST.get('method')
	else:
		j['meta']['method'] = request.method

	if request.REQUEST.has_key('filters'):
		try:
			j['meta']['filters'] = json.loads( request.REQUEST.get('filters') )
		except Exception, e:
			j['meta']['warnings'] = "property 'filters' JSON Exception: %s" % e
			j['meta']['filters'] = {}
	else:
		j['meta']['filters'] = {}

	if request.REQUEST.has_key('queries'):
		try:
			j['meta']['queries'] = json.loads( request.REQUEST.get('queries') )
		except Exception, e:
			j['meta']['warnings'] = "property 'queries' JSON Exception: %s" % e
			j['meta']['queries'] = None
	else:
		j['meta']['queries'] = None


	if request.REQUEST.has_key('order_by'):
		try:
			j['meta']['order_by'] = json.loads( request.REQUEST.get('order_by') )
		except Exception, e:
			j['meta']['warnings'] = "property 'order_by' JSON Exception: %s" % e
			j['meta']['order_by'] = {}
	else:
		j['meta']['order_by'] = {}

	# test against available methods, default with GET
	if not j['meta']['method']  in API_AVAILABLE_METHODS:
		j['meta']['method'] = 'GET'
		j['warnings'] = {'method':'default menthod GET applied, unhandled param "method" found in your request'}

	# offset, limit + next, prev like twitter 
	if j['meta']['method'] == 'GET':	

		if request.REQUEST.has_key('offset') or request.REQUEST.has_key('limit') :
			# check value
			if form.is_valid():
				j['meta']['offset']	= form.cleaned_data['offset'] if form.cleaned_data['offset'] else API_DEFAULT_OFFSET 
				j['meta']['limit']	= form.cleaned_data['limit'] if form.cleaned_data['limit'] else API_DEFAULT_LIMIT 
			else:
				j['meta']['offset']	= API_DEFAULT_OFFSET 
				j['meta']['limit']	= API_DEFAULT_LIMIT 
				j['meta']['errors']	= form.errors
		else:
			# default values
			j['meta']['offset']	= API_DEFAULT_OFFSET
			j['meta']['limit']	= API_DEFAULT_LIMIT 
		
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
		


	
	
	return j
