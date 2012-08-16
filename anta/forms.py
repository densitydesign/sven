from django import forms
from django.forms.extras.widgets import SelectDateWidget
from django.forms import ModelForm

from django.contrib.admin import widgets 
from datetime import datetime
from sven.anta.models import *

class LoginForm( forms.Form ):
	username = forms.CharField( max_length=32, widget=forms.TextInput )
	password = forms.CharField( max_length=64, label='Password', widget=forms.PasswordInput(render_value=False ) )
	
#
#    ====================
#    ---- MODEL FORM ----
#    ====================
class UpdateDocumentForm( forms.Form ):
	title = forms.CharField( required=False )
	ref_date = forms.DateTimeField( required=False )
	language = forms.CharField( max_length=2, required=False )
	

class TagForm( forms.ModelForm ):
	class Meta:
		model = Tag
		fields = ('type','name')

#
#    ===================
#    ---- API FORMS ----
#    ===================
#

class ApiMetaForm( forms.Form ):
	offset	= forms.IntegerField( min_value=0, required=False, initial=0 )
	limit	= forms.IntegerField( min_value=1, max_value=100, required=False, initial=25 )

class ApiDocumentsFilter( forms.Form ):
	start_date = forms.DateField()
	end_date = forms.DateField(initial=datetime.today)
	
class ApiRelationForm(ModelForm):	
	class Meta:
		model = Relation	

class ApiCorpusForm(ModelForm):	
	class Meta:
		model = Corpus	
