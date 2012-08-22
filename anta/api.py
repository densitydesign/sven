from django.http import HttpResponse, HttpRequest, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from sven.anta.models import *
from sven.anta.sync import store_document

from django.conf import settings
from django.contrib.auth import login, logout
from django.core import serializers
import os, json, datetime

from sven.anta.utils import *
from sven.anta.forms import *
from django.contrib.auth.models import User
from django.db.models import Count

#
#    ========================
#    ---- JSON API CONST ----
#    ========================
#
API_LOGIN_REQUESTED_URL = '/sven/anta/api/login-requested'	 # needs to be logged in
API_ACCESS_DENIED_URL = '/sven/anta/api/access-denied'	 # needs to be logged in and th corpus should be cool
API_DEFAULT_OFFSET = 0
API_DEFAULT_LIMIT = 50
API_AVAILABLE_METHODS = [ 'PUT', 'DELETE', 'POST', 'GET' ]

API_EXCEPTION				=	'GenericException'
API_EXCEPTION_DOESNOTEXIST	=	'DoesNotExist'
API_EXCEPTION_DUPLICATED	=	'Duplicated'
API_EXCEPTION_FORMERRORS	=	'FormErrors'
API_EXCEPTION_INCOMPLETE	=	'Incomplete'
API_EXCEPTION_EMPTY			=	'Empty'


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

def get_corpora(request):
	response = _json( request )
	response['objects']	= [ c.json() for c in Corpus.objects.all() ]
	return render_to_json( response )

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
	
	if request.REQUEST.has_key( 'corpus' ):
		try:
			response['corpus'] = Corpus.objects.get(name=corpus).json()
		except:
			return throw_error( response, error="aje, corpus does not exist...")
		response['meta']['total'] = Relation.objects.filter( source__corpus__name=corpus, target__corpus__name=corpus).count()		
		response['results'] = [r.json() for r in Relation.objects.filter( source__corpus__name=corpus, target__corpus__name=corpus) [response['meta']['offset']:response['meta']['limit'] ]  ]
		return render_to_json( response )
	
	if len(response['meta']['filters']) > 0:
		#mod for python 2.6 bug
		newFilters = {}
		oldFilters = response['meta']['filters']
		for oldFilter in oldFilters:
			newFilters[str(oldFilter)] = str(oldFilters[oldFilter])
		# with filters: models static var
		response['meta']['total'] = Relation.objects.filter(**newFilters).count()
		response['results'] = [r.json() for r in Relation.objects.filter(**newFilters)[ response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	else:
		response['meta']['total'] = Relation.objects.count()
		response['results'] = [r.json() for r in Relation.objects.all()[ response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	
	return render_to_json( response )

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
	r =  _get_relation( id )
	if r is None:
		return throw_error( response, "Relation %s does not exist...," % id, code=API_EXCEPTION_DOESNOTEXIST )	
	
	response['results'] = [r.json()]
		
	if response['meta']['method'] == 'DELETE':
		r.delete()		
	
	
	return render_to_json( response )


#
#    =================
#    ---- CORPORA ----
#    =================
#	
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def corpora(request):
	response = _json( request )

	# create documents
	if response['meta']['method'] == 'POST':
		return create_corpus( request, response )
	
	if len(response['meta']['filters']) > 0:
		# with filters: models static var
		response['meta']['total'] = Corpus.objects.filter(**response['meta']['filters']).count()
		response['results'] = [c.json() for c in Corpus.objects.filter(**response['meta']['filters'])[ response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	else:
		response['meta']['total'] = Corpus.objects.count()		
		response['results'] = [c.json() for c in Corpus.objects.all()[ response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	
	
	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def create_corpus( request, response ):
	response['owner'] = request.user.json()
	
	form = ApiCorpusForm( request.REQUEST, initial={'owner':request.user.id} )
	if form.is_valid():		
		corpus_path = settings.MEDIA_ROOT + os.path.basename( form.cleaned_data['name'] )
		response['corpus_path'] = corpus_path

		try:
			# create corpus
			
			# create folder if does not exists
			if not os.path.exists( corpus_path ):
				os.makedirs( corpus_path )
			
			c = Corpus( name=form.cleaned_data['name'] )
			
			c.save()
			o = Owners( corpus=c, user=request.user )
			o.save()
			
		except Exception, e:
			return throw_error( response, error="Exception: %s" % e, code="fault" )



			
		response['created'] = c.json()
		return render_to_json( response )
	else:
		return throw_error( response, error=form.errors, code=API_EXCEPTION_FORMERRORS )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def corpus( request, id ):
	response = _json( request )
	# all documents
	c =  _get_corpus( id )
	if c is None:
		return throw_error( response, "Corpus %s does not exist...," % id, code=API_EXCEPTION_DOESNOTEXIST )	
	
	response['results'] = [c.json()]
		
	if response['meta']['method'] == 'DELETE':
		c.delete()		
	
	
	return render_to_json( response )


#
#    ==================
#    ---- DOCUMENTS----
#    ==================
# 
# csfr exempt should be used only in debug mode when your're lazy.	
# from django.views.decorators.csrf import csrf_exempt
# @csrf_exempt
@login_required( login_url = API_LOGIN_REQUESTED_URL )
def documents(request):
	response = _json( request )

	# create documents
	if not request.REQUEST.has_key( 'corpus' ):
		return throw_error( response, error="corpus param is empty", code=API_EXCEPTION_INCOMPLETE)
	
	try:
		corpus = Corpus.objects.get(id=request.REQUEST.get('corpus'))
	except Exception, e:
		return throw_error( response, error="Exception: %s " % e, code=API_EXCEPTION_DOESNOTEXIST )
	
	response['corpus'] = corpus.json()

	# to create a document, 
	if response['meta']['method'] == 'POST':
		return create_document( request, response, corpus=corpus )


	if len(response['meta']['filters']) > 0:
		#mod for python 2.6 bug
		newFilters = {}
		oldFilters = response['meta']['filters']
		for oldFilter in oldFilters:
			newFilters[str(oldFilter)] = str(oldFilters[oldFilter])
		# with filters: models static var
		response['meta']['total'] = Document.objects.filter(corpus__id=corpus.id).filter(**newFilters).count()
		response['results'] = [d.json() for d in Document.objects.filter(corpus__id=corpus.id).filter(**newFilters)[ response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	else:
		
		response['meta']['total'] = Document.objects.filter(corpus__id=corpus.id).count()		
		response['results'] = [d.json() for d in Document.objects.filter(corpus__id=corpus.id)[ response['meta']['offset']: response['meta']['offset'] + response['meta']['limit'] ] ]
	
	
	return render_to_json( response )

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def create_document( request, response, corpus ):



	path = settings.MEDIA_ROOT + corpus.name + "/"
	
	# uncomment to debug
	response['path'] = path
	
	if not os.path.exists( path ):
		return throw_error(response, code=API_EXCEPTION_DOESNOTEXIST, error="path %s does not exits!" % path )

	response['uploads'] = []

	# request files. cfr upload.html template with blueimp file upload
	if not request.FILES.has_key('files[]'):
		return throw_error( response, error="request.FILES['files[]'] was not found", code=API_EXCEPTION_INCOMPLETE)
	for f in request.FILES.getlist('files[]'):
		# store locally and save happily
		if f.size == 0:
			return throw_error(response, error="uploaded file is empty", code=API_EXCEPTION_EMPTY)
		
		# filename
		filename = path + f.name 

		# get permission to store the document. If it exists, will force override!
		try:
			destination = open( filename , 'wb+')
		except Exception, e:
			return throw_error( response, error="Exception: %s " % e, code=API_EXCEPTION_EMPTY)
		
		# save file
		for chunk in f.chunks():
			destination.write(chunk)
			destination.close()

		# save document
		try:
			d = store_document( filename=filename, corpus=corpus )
		except Exception, e:
			return throw_error( response, error="Exception: %s " % e, code=API_EXCEPTION_EMPTY)
		response['uploads'].append( d.json() )

	return render_to_json( response )
	

@login_required( login_url = API_LOGIN_REQUESTED_URL )
def document(request, document_id):
	response = _json( request )

	# create or update a document
	# @todo	

	d = _get_document( document_id )
	if d is None:
		return throw_error( response, "document %s does not exist..." % document_id, code=API_EXCEPTION_DOESNOTEXIST)
	
	
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
			return throw_error( response, error=form.errors, code=API_EXCEPTION_FORMERRORS)


	# load text only if it's required
	if 'with-text' in response['meta']:

		text = textify( d, settings.MEDIA_ROOT )
		
		if text is None:
			return throw_error( response, "unable to provide txt version of the document")
		
		response['text']	= open(text, 'r').read()
	
	# f = open( text, "r")
		
	response['results'] = [ d.json() ]
	
	return render_to_json( response )


#
#    ==================
#    ---- SPECIALS ----
#    ==================
#	 
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

def tfidf( request, corpus_id ):
	"""
	START the classic tfidf extraction. 
	Open related sub-process with routine id.
	Return the routine created.
	"""
	from distiller import start_routine, stop_routine
	import subprocess, sys

	response = _json( request, enable_method=False )
	
	try:
		c = Corpus.objects.get(pk=corpus_id)
	except Exception, e:
		return throw_error( response, error="Exception: %s" % e, code=API_EXCEPTION_DOESNOTEXIST )

	routine = start_routine( type='tfidf', corpus=c )
	if routine is None:
		throw_error( response, error="A very strange error", code=API_EXCEPTION_EMPTY)

	# call a sub process, and pass the related routine id
	scriptpath = os.path.dirname(__file__) + "/metrics.py"
	response['routine'] = routine.json()
	
	try:
		subprocess.Popen([ "python", scriptpath, '-r', str(routine.id), '-c', str(c.id), '-f', 'standard' ], stdout=None, stderr=None)
	except Exception, e:
		return throw_error(response, error="Exception: %s" % e, code=API_EXCEPTION)
	return render_to_json( response )



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
	    	t.name,  s.stemmed as concept, MAX(ds.tfidf), AVG(tf),
			count( DISTINCT s.id ) as distro 
		FROM `anta_document_segment` ds
			JOIN anta_segment s ON s.id = ds.segment_id
			JOIN anta_document d ON d.id = ds.document_id
			JOIN anta_document_tag dt ON dt.document_id = ds.document_id 
			JOIN anta_tag t ON t.id = dt.tag_id 
			
		WHERE d.corpus_id = %s """ + filters + """ AND t.type='actor'
		GROUP BY t.id, concept  ORDER BY `distro` DESC
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
	response = _json( request )
	
	c =  _get_corpus( corpus_id )
	if c is None:
		return throw_error( response, "Corpus %s does not exist...," % corpus_id, code=API_EXCEPTION_DOESNOTEXIST )	
	

	# understand filters, if any
	filters = ["d1.corpus_id=%s", "d2.corpus_id=%s"]
	ids = []

	if len( response['meta']['filters'] ):
		ids = [ str(d.id) for d in Document.objects.filter(corpus__id=corpus_id,**response['meta']['filters'])]
		if len(ids) > 0:
			filters.append( "d1.id IN ( %s )" % ",".join(ids) )
			filters.append( "d2.id IN ( %s )"  % ",".join(ids) )
		else:
			response['meta']['total'] = 0;
			response['nodes'] = {}
			response['edges'] = {}
			return render_to_json( response )
		response['filtered'] = ids

	filters.append("t1.type='actor'")
	filters.append( "t2.type='actor'")
	
	if len(ids):
		actors = Document_Tag.objects.filter(tag__type='actor', document__corpus__id=corpus_id, document__id__in=ids)
	else:
		actors = Document_Tag.objects.filter(tag__type='actor', document__corpus__id=corpus_id)
	# print nodes
	nodes = {}
	for dt in actors:
		
		if dt.tag.id in nodes:
			nodes[ dt.tag.id]['group'] = nodes[ dt.tag.id]['group'] + 1
			continue

		nodes[ dt.tag.id] = {
			'group': 1,
			'name':dt.tag.name,
			'id':dt.tag.id
		}

	# load relations and distances
	edges = []
	from django.db import connection

	#  "document__ref_date__gt": 20111011, 
    #  "document__ref_date__lt": 20121011
	
	cursor = connection.cursor()
	cursor.execute("""
		    SELECT 
		    t1.id as alpha_actor,  
		    t2.id as omega_actor,
		    AVG( y.cosine_similarity ) as average_cosine_similarity
		FROM `anta_distance` y
		JOIN anta_document_tag dt1 ON y.alpha_id = dt1.document_id
		JOIN anta_document_tag dt2 ON y.omega_id = dt2.document_id  
		JOIN anta_tag t1 ON dt1.tag_id = t1.id
		JOIN anta_tag t2 ON dt2.tag_id = t2.id
		JOIN anta_document d1 ON y.alpha_id = d1.id
		JOIN anta_document d2 on y.omega_id = d2.id
		    WHERE 
		    """ + " AND ".join( filters ) + """
		GROUP BY alpha_actor, omega_actor
		ORDER BY average_cosine_similarity
	""",[ corpus_id, corpus_id])

	for row in cursor.fetchall():
		edges.append({
			'value':row[2],
			'source':row[1],
			'target':row[0]
		})
    # Data modifying operation - commit required
	response['edges'] = edges
	# load distances


	response['nodes'] = nodes

	return render_to_json( response )

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
	except Eception, e:
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
	c =  _get_corpus( corpus_id )
	if c is None:
		return throw_error( _json( request, enable_method=False ), error="corpus id %s does not exist..." % corpus_id, code=API_EXCEPTION_DOESNOTEXIST )
	import unicodecsv
	ss = Segment.objects.raw("""
		SELECT 
			`anta_segment`.`id`, `anta_segment`.`content`, `anta_segment`.`language`, 
			`anta_segment`.`stemmed`, `anta_segment`.`status`, 
			MAX(`anta_document_segment`.`tfidf`) AS `max_tfidf`,
			MAX(`anta_document_segment`.`tf`) AS `max_tf`, 
			COUNT(`anta_document_segment`.`document_id`) AS `distro` 
		FROM `anta_segment`
			JOIN `anta_document_segment` ON (`anta_segment`.`id` = `anta_document_segment`.`segment_id`) 
			JOIN `anta_document` ON (`anta_document_segment`.`document_id` = `anta_document`.`id`) 
		WHERE `anta_document`.`corpus_id` = %s AND content NOT REGEXP '^[[:alpha:]][[:punct:]]$'
		GROUP BY `anta_segment`.`id`
		""",[corpus_id]
	) 
	
	response = HttpResponse(mimetype='text/csv; charset=utf-8')
	response['Content-Description'] = "File Transfer";
	response['Content-Disposition'] = "attachment; filename=%s.csv" % c.name 
	writer = unicodecsv.writer(response, encoding='utf-8')
	
	# headers	
	writer.writerow(['segment_id', 'content', 'concept', 'distribution', 'max_tf', 'max_tfidf'])

	for s in ss:
		writer.writerow([  s.id, s.content, s.stemmed, s.distro,  s.max_tf, s.max_tfidf])
	
	return response

#
#    ======================
#    ---- OTHER STUFFS ----
#    ======================
#

	

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
	j =  {"status":"ok", 'meta':{ 'indent':False } }
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
		except:
			j['meta']['filters'] = []
	else:
		j['meta']['filters'] = []

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
	
def render_to_json( response ):
	if response['meta']['indent']:
		return HttpResponse( json.dumps( response, indent=4),  mimetype="text/plain")	
	return HttpResponse( json.dumps( response ),  mimetype="text/plain")



def throw_error( response, error="", status="ko", code="404", verbose="", friendly="" ):
	response[ 'error' ] = error # developer message
	response[ 'status' ] = status
	response[ 'errorCode' ] = code
	response[ 'userMessage' ] = friendly

	return render_to_json( response )
