from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
#from django.contrib import admin
#admin.autodiscover()
import sven
urlpatterns = patterns('',
	
    url(r'documents/$', 'sven.gui.views.documents', name='gui_documents'),
	url(r'documents/(?P<id_document>\d+)/$', 'sven.gui.views.documents', name='gui_list'),
	url(r'timeline/$', 'sven.gui.views.timeline', name='gui_timeline'),
    url(r'dynamics/$', 'sven.gui.views.dynamics', name='gui_dynamics'),
)