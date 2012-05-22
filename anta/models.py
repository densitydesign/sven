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
	
class Entity( models.Model):	
	# a special NP. pos tag should be described as tags attached.
	name = models.CharField( max_length=128 )
	lemma = models.SlugField( max_length=128 ) # no space alphabetic ordered LEMMA
	type =  models.CharField( max_length=2, choices=CREATION_CHOICES )
	tags = models.ManyToManyField( Tag, through='Entity_Tag' )
	documents = models.ManyToManyField( Document, through='Entity_Metric' )
	status = models.CharField( max_length=3, choices=ENTITY_STATUS_CHOICES )
	
	class Meta:
		unique_together = ("name", "type") 



class Entity_Metric( models.Model ):
	entity = models.ForeignKey( Entity )
	document = models.ForeignKey( Document )
	tf = models.FloatField() # term absolute frequency of the entity
	idf = models.FloatField( default=0 )
	class Meta:
		unique_together = ("entity", "document")

	
class Entity_Tag( models.Model ):
	entity = models.ForeignKey(Entity)
	tag =  models.ForeignKey(Tag)
	class Meta:
		unique_together = ("entity", "tag")
		
class Document_Tag( models.Model):
	document = models.ForeignKey( Document )
	tag =  models.ForeignKey( Tag )
	
	class Meta:
		unique_together = ("document", "tag")

