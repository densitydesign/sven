from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

import sven

urlpatterns = patterns('',
	url(r'^$', 'sven.anta.views.index', name='anta_index'),
	url(r'^login/$', 'sven.anta.views.login_view', name='anta_login'),
	url(r'^logout/$', 'sven.anta.views.logout_view', name='anta_logout'),
	
	url(r'^upload/$', 'sven.anta.views.upload', name='anta_upload'),
	
	# Examples:
	# url(r'^$', 'svenz.views.home', name='home'),
	# url(r'^svenz/', include('svenz.foo.urls')),
	# Uncomment the admin/doc line below to enable admin documentation:
	# url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
	# url(r'^$', anta.api.index, name="anta_api_index"),
	# url(r'^/set-relation/corpus/(.?)/', anta.api.set_relation, name="anta_api_set_relation"),
    
	# api
	url(r'^api/$', 'sven.anta.api.index', name='anta_api_index'),    
	
	# special api urls, dummy gummy is a tester
	url(r'^api/access-denied/$', 'sven.anta.api.access_denied', name='anta_api_access_denied' ),
	url(r'^api/login-requested/$', 'sven.anta.api.login_requested', name='anta_api_login_requested' ),
	url(r'^api/dummy-gummy/$', 'sven.anta.api.dummy_gummy', name='anta_api_dummy_gummy' ),
	url(r'^api/logout/$', 'sven.anta.api.logout_view', name='anta_api_logout_view' ),

	# documents
	url(r'^api/documents/$', 'sven.anta.api.documents', name='anta_api_documents' ),    
	url(r'^api/documents/(\d+)/$', 'sven.anta.api.document', name='anta_api_document' ),    
	
	# relations
	url(r'^api/relations/$', 'sven.anta.api.relations', name='anta_api_relations' ),    
	url(r'^api/relations/(\d+)/$', 'sven.anta.api.relation', name='anta_api_relation' ),    
	
	# corpus (sing.)
	url(r'^api/corpus/$', 'sven.anta.api.corpora', name='anta_api_corpora' ),    
	url(r'^api/corpus/(\d+)/$', 'sven.anta.api.corpus', name='anta_api_corpus' ),    
	
	
	
	# specials, maybe @torefine
	url(r'^api/attach-free-tag/document/(\d+)/$', 'sven.anta.api.attach_free_tag', name='anta_api_attach_free_tag' ),
	url(r'^api/attach-tag/document/(\d+)/tag/(\d+)/$', 'sven.anta.api.attach_tag', name='anta_api_attach_tag' ),
	url(r'^api/detach-tag/document/(\d+)/tag/(\d+)/$', 'sven.anta.api.detach_tag', name='anta_api_detach_tag' ),
	
	url(r'^api/start-metrics/(\d+)/$', 'sven.anta.api.start_metrics', name='anta_api_start_metrics' ),
	url(r'^api/tfidf/corpus/(\d+)/$', 'sven.anta.api.tfidf', name='anta_api_tfidf' ),

	url(r'^api/relations/graph/corpus/(\d+)/$', 'sven.anta.api.relations_graph', name='anta_api_relations_graph' ),
	url(r'^api/documents/download/(\d+)/$', 'sven.anta.api.download_document', name='anta_api_download_document'),
	url(r'^api/status/corpus/(\d+)/$', 'sven.anta.api.pending_routine_corpus', name='anta_api_pending_routine_corpus' ),

	# url(r'^api/status/corpus/(\d+)/$', 'sven.anta.api.pending_analysis_corpus', name='anta_api_pending_analysis_corpus' ),

	
	url(r'^api/segments/export/corpus/(\d+)/$', 'sven.anta.api.segments_export', name='anta_api_segments_export' ),
	url(r'^api/streamgraph/corpus/(\d+)/$', 'sven.anta.api.streamgraph', name='anta_api_streamgraph' ),
	# url(r'^api/get-corpora/$', 'sven.anta.api.get_corpora', name='anta_api_get_corpora' ),    
	# url(r'^api/get-corpus/(\w+)/$', 'sven.anta.api.get_corpus', name='anta_api_get_corpus' ),    
	
	# url(r'^api/get-documents/corpus/(\w+)/$', 'sven.anta.api.get_documents', name='anta_api_get_documents' ),    
	# url(r'^api/get-document/(\d+)/$', 'sven.anta.api.get_document', name='anta_api_get_document' ),    
	    

    # Uncomment the next line to enable the admin:
	url(r'^admin/', include(admin.site.urls)),
)
