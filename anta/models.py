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

ANALYSIS_CHOICES = (
	(u'TX', u'textify'),
    (u'OUT', u'excluded'),
)

ANALYSIS_STATUS_CHOICES = (
	(u'OK', u'completed'),
    (u'PD', u'pending'),
    (u'ERR', u'error'),
)

ENTITY_STATUS_CHOICES = (
	(u'IN', u'included'),
    (u'OUT', u'excluded'),
    (u'MER', u'merged')
)

POLARITY_CHOICES = (
	(u'POS', u'positive'),
    (u'NEG', u'negative'),
    (u'?', u'not defined'),
)

POS_CHOICES = (
	(u'NP', u'Noun phrase'),
    (u'?', u'not defined'),
)

# Create your models here.
# from many database to just one. just a test.
class Corpus( models.Model ):
	# the corpus of document. A user may have a lot of corpora
	name = models.CharField( max_length=32 )
	owner = models.ManyToManyField( User, through='Owners', null=True )
	def __unicode__(self):
		return self.name

class Tag( models.Model ):
	name  = models.CharField( max_length=64 )
	lemma = models.SlugField( max_length=64 )
	type  = models.CharField( max_length=32 )
	def __unicode__(self):
		return self.name

class Document( models.Model ):
	# the document in the corpus
	title = models.TextField()
	language = models.CharField( max_length=2, choices=LANGUAGE_CHOICES )
	status = models.CharField( max_length=3, choices=DOCUMENT_STATUS_CHOICES )
	url = models.FileField( upload_to="corpus")
	mime_type = models.CharField( max_length = 100)
	upload_date = models.DateTimeField(  default=datetime.now(), blank=None, null=None )
	ref_date =  models.DateTimeField(  default=datetime.now(), blank=None, null=None )
	corpus = models.ForeignKey( Corpus )
	tags = models.ManyToManyField( Tag, through='Document_Tag' )
	def __unicode__(self):
		return self.title

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
	owner = models.ForeignKey( User )
	class Meta:
		unique_together = ("source", "target") 

class Analysis(models.Model ):
	document= models.ForeignKey( Document )
	start_date = models.DateField( blank=True )
	end_date = models.DateField( blank=True )
	type = models.CharField( max_length=2, choices=ANALYSIS_CHOICES )
	result = models.CharField( max_length=3, choices= ANALYSIS_STATUS_CHOICES )
	
# 
#
# TEXT ANALYSIS
# =============
#
# "Tag" here refers to human annotation activity.
#

class Relatum( models.Model ):
	content = models.CharField( max_length=128 )
	language = models.CharField( max_length=2, choices=LANGUAGE_CHOICES )
	
class Concept( models.Model ):
	content	= models.CharField( max_length=128 )
	language = models.CharField( max_length=2, choices=LANGUAGE_CHOICES )
	relata	= models.ManyToManyField( Relatum, through="Semantic_Relation" )

class Semantic_Relation( models.Model ):
	concept = models.ForeignKey( Concept )
	relatum	= models.ForeignKey( Relatum )

# Segment is the base class for POS tagging, it will contain NP, VP accoring to analysis chosen.
class Segment( models.Model):	
	
	content 	= models.CharField( max_length=128 )
	pos			= models.CharField( max_length=3, choices=POS_CHOICES )
	language	= models.CharField( max_length=2, choices=LANGUAGE_CHOICES )
	stemmed		= models.SlugField( max_length=128 ) # no space alphabetic ordered
	type 		= models.CharField( max_length=2, choices=CREATION_CHOICES, default='PT' )
	
	ref_tfidf	= models.FloatField( default='0') # will be calcolated according to tf from Document_Segment as AVG or MAX or MIN of tfidf
	status		= models.CharField( max_length=3, choices=ENTITY_STATUS_CHOICES, default='IN' )
	
	tags 		= models.ManyToManyField( Tag,  through="Segment_Tag" )
	documents 	= models.ManyToManyField( Document, through="Document_Segment" ) # contains info about document term frequency
	concepts	= models.ManyToManyField( Concept,  through="Segment_Concept" )
	
	class Meta:
		unique_together = ("content", "language", "type") 
		# a content which has the same pos tag and the same creation mode
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

		