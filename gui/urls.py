from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
#from django.contrib import admin
#admin.autodiscover()
import sven
urlpatterns = patterns('',
	
	url(r'login/$', 'sven.gui.views.login_view', name='gui_login'),
	url(r'logout/$', 'sven.gui.views.logout_view', name='gui_logout'),

	url(r'documents/$', 'sven.gui.views.documents', name='gui_documents'),
	url(r'relations/(?P<id_relation>\d+)/$', 'sven.gui.views.relations', name='gui_relations'),
	#url(r'documents/(?P<corpus_name>[0-9a-z-]+)/$', 'sven.gui.views.corpus_documents', name='gui_corpus_documents'),
	url(r'documents/(?P<id_document>\d+)/$', 'sven.gui.views.documents', name='gui_list'),
	url(r'timeline/$', 'sven.gui.views.timeline', name='gui_timeline'),
	url(r'dynamics/$', 'sven.gui.views.dynamics', name='gui_dynamics'),
	url(r'stream/$', 'sven.gui.views.stream', name='gui_stream'),
	url(r'viewer/$', 'sven.gui.views.pdfviewer', name='gui_pdfviewer'),
)