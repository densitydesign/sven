from django.db import models
from django.contrib.auth.models import User
from datetime import datetime 

LANGUAGE_CHOICES = (
	(u'NL', u'Dutch'),
    (u'EN', u'English'),
)

CREATION_CHOICES = (
	(u'PT', u'PATTERN'),
    (u'MN', u'MANUAL'),
)

DOCUMENT_STATUS_CHOICES = (
	(u'IN', u'included'),
    (u'OUT', u'excluded'),
)

GRAPH_CHOICES = (
	(u'Ge', u'gephi GEXF'),
	(u'JS', u'json')
)

GRAPH_STATUS_CHOICES = (
	(u'OK', u'completed'),
	(u'CRE',u'creation'),
    (u'PD', u'pending'),
    (u'ERR', u'error'),
)

ROUTINE_CHOICES = (
	(u'TFIDF', u'tfidf computation'),
	(u'IMPORT', u'import stemmed segments'),
)

ANALYSIS_CHOICES = (
	(u'PT', u'PATTERN'),
    (u'AL', u'ALCHEMY'),
    (u'OC', u'OPENCALAIS'),
    (u'WI', u'WIKIPEDIA'),
)

STATUS_CHOICES = (
	(u'OK', u'completed'),
	(u'CRE',u'creation'),
	(u'BOO',u'boo!'),
    (u'PD', u'pending'),
    (u'CLO', u'closed after error'), 
    (u'ERR', u'error'),
)

ENTITY_STATUS_CHOICES = (
	(u'IN', u'included'),
    (u'OUT', u'excluded'),
    (u'MER', u'merged')
)

POLARITY_CHOICES = (
	(u'NNE', u'very negative'),
    (u'NEG', u'negative'),
	(u'NEU', u'neuter'),
	(u'POS', u'positive'),
	(u'PPO', u'very positive'),	
)

POS_CHOICES = (
	(u'NP', u'Noun phrase'),
    (u'?', u'not defined'),
)

# user json function
def user_json( user ):
	return{
		'id': user.id,
		'username': user.username	
	}

User.add_to_class('json', user_json )


# Create your models here.
# from many database to just one. just a test.
class Corpus( models.Model ):
	# the corpus of document. A user may have a lot of corpora
	name = models.CharField( max_length=32, unique=True )
	owner = models.ManyToManyField( User, through='Owners', null=True, blank=True )
	def __unicode__(self):
		return self.name

	def json(self):
		return { 
			'id':self.id,
			'name':self.name
		}		

class Tag( models.Model ):
	name  = models.CharField( max_length=64 )
	lemma = models.SlugField( max_length=64 )
	type  = models.CharField( max_length=32 )
	
	class Meta:
		unique_together = ("name", "type") 

	def __unicode__(self):
		return self.name
	
	def json(self):
		return {
			'id'	: self.id,
			'name'	: self.name
		}	


class Relatum( models.Model ):
	# freebase notable segments are entity attached
	content		= models.CharField( max_length=64 )
	language	= models.CharField( max_length=2, choices=LANGUAGE_CHOICES )
	slug		= models.CharField( max_length=64 ) # freebase id
	name		= models.CharField( max_length=64 ) # freebase name
	class Meta:
		unique_together = ("slug", "language") 
		
class Concept( models.Model ):
	content	= models.CharField( max_length=128 )
	language = models.CharField( max_length=2, choices=LANGUAGE_CHOICES )
	relata	= models.ManyToManyField( Relatum, through="Semantic_Relation" )


class Document( models.Model ):
	# the document in the corpus
	title = models.TextField()
	language = models.CharField( max_length=2, choices=LANGUAGE_CHOICES )
	status = models.CharField( max_length=3, choices=DOCUMENT_STATUS_CHOICES )
	url = models.FileField( upload_to="corpus")
	mime_type = models.CharField( max_length = 100)
	upload_date = models.DateTimeField(  default=datetime.now(), blank=None, null=None )
	ref_date =  models.DateTimeField(  default=datetime.now(), blank=True, null=True )
	corpus = models.ForeignKey( Corpus )
	tags = models.ManyToManyField( Tag, through='Document_Tag' )
	concepts = models.ManyToManyField( Concept, through='Document_Concept' )

	def __unicode__(self):
		return self.title

	# get tfidf most important segments grouped by concept
	def segments( self, limit=25 ):

		return 	[ s for s in Segment.objects.raw( 
			"""
			SELECT s.id, s.stemmed, s.content, ds.tfidf, count( distinct ds.document_id ) as distribution, count( distinct s.id ) as aliases FROM anta_segment s 
				JOIN anta_document_segment ds ON s.id = ds.segment_id
			WHERE ds.document_id = %s
			GROUP BY s.stemmed
			ORDER BY ds.tfidf DESC, distribution DESC, aliases DESC, s.stemmed DESC LIMIT %s
			""",[self.id, limit]
		)]

	def json(self):
		return {
			'id'	: self.id,
			'title'	: self.title,
			'language'	: self.language,
			'date'	: self.ref_date.isoformat() if self.ref_date else '',
			'mime_type':self.mime_type,
			'tags'	: [ t.json() for t in self.tags.exclude(type="actor") ],
			'actors': [ t.json() for t in self.tags.filter(type="actor") ],
			'concepts': [ c.json() for c in self.concepts.all() ],
			'relations_count': Relation.objects.filter(source__id=self.id).count(),
			'relations_as_target_count': Relation.objects.filter(target=self).count(),
			'corpus': self.corpus.json(),
			'segments': [ s.json() for s in self.segments() ]
		}

class Document_Tag( models.Model):
	document = models.ForeignKey( Document )
	tag =  models.ForeignKey( Tag )
	
	class Meta:
		unique_together = ("document", "tag")

class Distance( models.Model ):
	alpha = models.ForeignKey( Document, related_name="alpha" )
	omega = models.ForeignKey( Document, related_name="omega" )
	cosine_similarity = models.FloatField( default='0')
	euclidean_similarity = models.FloatField( default='0')
	manhattan_similarity = models.FloatField( default='0')
	
	class Meta:
		unique_together = ("alpha", "omega")
	
class Sentence( models.Model ):
	# the old dumb way to index a document
	content = models.TextField()
	position = models.IntegerField()
	document =  models.ForeignKey( Document )


class Owners( models.Model ):
	corpus= models.ForeignKey( Corpus )
	user = models.ForeignKey( User )
	class Meta:
		unique_together = ("corpus", "user")
	
class Relation( models.Model ):
	source = models.ForeignKey( Document, related_name="source" )
	target = models.ForeignKey( Document, related_name="target" )
	creation_date = models.DateTimeField(default=datetime.now, blank=True)
	description = models.CharField( max_length=160)
	polarity = models.CharField( max_length=3, choices=POLARITY_CHOICES )
	owner = models.ForeignKey( User, blank=True, null=True )
	class Meta:
		unique_together = ("source", "target") 

	def intensity( self, min, max):
		steps  = float(max - min) / len( POLARITY_CHOICES )
		return min + steps * [p[0] for p in POLARITY_CHOICES].index( self.polarity )

	def json(self, min=-1, max=1):
		return {
			'id'	: self.id,
			'source'	: self.source.id,
			'target'	: self.target.id,
			'creation_date'	: self.creation_date.isoformat(),
			'description'	: self.description,
			'polarity'	: self.polarity,
			'intensity'	: self.intensity( min=min, max=max),
			'owner': self.owner.json()
		}

class Analysis(models.Model ):
	corpus	 = models.OneToOneField( Corpus )
	document = models.ForeignKey( Document, blank=True, null=True ) # current document under analysis, ordered by
	start_date = models.DateTimeField( blank=True, null=True )
	end_date = models.DateTimeField( blank=True, null=True )
	type = models.CharField( max_length=2, choices=ANALYSIS_CHOICES ) # type of routine, like PT for Pattern routine.
	completion = models.FloatField( default=0, null=True )
	status = models.CharField( max_length=3, choices= STATUS_CHOICES )	

	def json(self, min=-1, max=1):
		return {
			'id'	: self.id,
			'type'	: self.type,
			'corpus'	: self.corpus.json(),
			'document'	: self.document.json() if self.document else None,
			'start_date'	: self.start_date.isoformat(),
			'end_date'	: self.end_date.isoformat() if self.end_date else None,
			'completion': self.completion,
			'status'	: self.status
		}

class Routine(models.Model):
	"""
	Verbose logging is inside log file: ~/sven/logs/%s.log % corpus.name
	last_entry will only show the very last LOG message (Wanring, fatal, info etc... )
	"""
	corpus	= models.ForeignKey( Corpus, null=True, blank=True )
	type	= models.CharField( max_length=8, choices=ROUTINE_CHOICES )
	status	= models.CharField( max_length=3, default="BOO", choices=STATUS_CHOICES )
	start_date	= models.DateTimeField( default=datetime.now(), blank=True, null=True )
	last_entry_date	= models.DateTimeField( default=datetime.now(), blank=True, null=True )
	end_date	= models.DateTimeField( blank=True, null=True )
	completion	= models.FloatField( default=0, null=True )
	last_entry	= models.TextField()
	analysis = models.ManyToManyField( Analysis )

	def json(self):
		return {
			'id'	: self.id,
			'type'	: self.type,
			'corpus'	: self.corpus.json() if self.corpus else None,
			'start_date'	: self.start_date.isoformat(),
			'end_date'	: self.end_date.isoformat() if self.end_date else None,
			'last_entry': self.last_entry,
			'status'	: self.status,
			'completion': self.completion,
			'analysis'	: [a.json() for a in self.analysis.all() ] if self.analysis else []
		}

#
#    ==================================
#    ---- GRAPH MEASURES AND GEXFS ----
#    ==================================
#
class Graph( models.Model ):
	corpus	= models.ForeignKey( Corpus )
	description = models.CharField( max_length=128 )
	type	= models.CharField( max_length=2, choices=GRAPH_CHOICES )
	date	= models.DateTimeField(  default=datetime.now(), blank=None, null=None )
	url		= models.FileField( upload_to="graphs")
	status	= models.CharField( max_length=2, choices=GRAPH_STATUS_CHOICES )


# 
#    =======================
#    ---- TEXT ANALYSIS ----
#    =======================
#
# "Tag" here refers to human annotation activity.
#


class Concept_Metrics( models.Model ):
	concept = models.ForeignKey( Concept, unique=True )
	betweenness_centrality	= models.FloatField( default='0') 
	degree_centrality		= models.FloatField( default='0') 
	closeness_centrality	= models.FloatField( default='0') 

class Semantic_Relation( models.Model ):
	concept = models.ForeignKey( Concept )
	relatum	= models.ForeignKey( Relatum )
	class Meta:
		unique_together = ("concept", "relatum") 

class Document_Concept( models.Model):
	document = models.ForeignKey( Document )
	concept =  models.ForeignKey( Concept )
	tf = models.FloatField( default=1 ) # term'concept' absolute frequency of the stemmed version of the segment
	tfidf = models.FloatField( default='0') # calculated according to the document
	
	class Meta:
		unique_together = ("document", "concept")



# Segment is the base class for POS tagging, it will contain NP, VP accoring to analysis chosen.
class Segment( models.Model):	
	
	content 	= models.CharField( max_length=128 )
	pos			= models.CharField( max_length=3, choices=POS_CHOICES )
	language	= models.CharField( max_length=2, choices=LANGUAGE_CHOICES )
	stemmed		= models.SlugField( max_length=128 ) # no space alphabetic ordered
	stemmed_refined	= models.SlugField( max_length=128 ) # no space alphabetic ordered
	
	type 		= models.CharField( max_length=2, choices=CREATION_CHOICES, default='PT' )
	
	ref_tfidf	= models.FloatField( default='0') # will be calcolated according to tf from Document_Segment as AVG or MAX or MIN of tfidf
	status		= models.CharField( max_length=3, choices=ENTITY_STATUS_CHOICES, default='IN' )
	
	tags 		= models.ManyToManyField( Tag,  through="Segment_Tag" )
	documents 	= models.ManyToManyField( Document, through="Document_Segment" ) # contains info about document term frequency
	concepts	= models.ManyToManyField( Concept,  through="Segment_Concept" )
	relata		= models.ManyToManyField( Relatum, through="Segment_Semantic_Relation" )
	
	class Meta:
		unique_together = ("content", "language", "type") 
		# a content which has the same pos tag and the same creation mode

	def json(self):
		return {
			'id'	: self.id,
			'stemmed': self.stemmed,
			'content': self.content,
			'tfidf'	 : self.tfidf if self.tfidf else 0.0,
			'distribution': self.distribution if self.distribution else 0,
			'aliases': self.aliases if self.aliases else None
		}

class Segment_Semantic_Relation( models.Model ):
	segment = models.ForeignKey( Segment )
	relatum	= models.ForeignKey( Relatum )
	class Meta:
		unique_together = ("segment", "relatum") 




class Segment_Concept( models.Model ):
	segment = models.ForeignKey( Segment )
	concept = models.ForeignKey( Concept )
	class Meta:
		unique_together = ("segment", "concept" )

class Segment_Segment( models.Model ):
	source = models.ForeignKey( Segment, related_name="source" )
	target = models.ForeignKey( Segment, related_name="target" )
	class Meta:
		unique_together = ("source", "target" )

class Segment_Tag( models.Model ):
	segment = models.ForeignKey( Segment )
	tag = models.ForeignKey( Tag )
	class Meta:
		unique_together = ("segment", "tag" )

class Document_Segment( models.Model ):
	document = models.ForeignKey( Document )
	segment = models.ForeignKey( Segment )
	tf = models.FloatField( default=1 ) # term absolute frequency of the stemmed version of the segment
	tfidf = models.FloatField( default='0') # calculated according to the document via the stemmed version 
	class Meta:
		unique_together = ("segment", "document")

		
