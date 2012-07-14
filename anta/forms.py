from django import forms
from django.forms.extras.widgets import SelectDateWidget
from django.forms import ModelForm

from django.contrib.admin import widgets 

class LoginForm( forms.Form ):
	username = forms.CharField( max_length=12, widget=forms.TextInput )
	password = forms.CharField( max_length=64, label='Password', widget=forms.PasswordInput(render_value=False ) )
	
class ApiMetaForm( forms.Form ):
	offset	= forms.IntegerField( min_value=0, required=False, initial=0 )
	limit	= forms.IntegerField( min_value=1, max_value=100, required=False, initial=25 )
	
	
