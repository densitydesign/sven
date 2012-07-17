from django.conf.urls.defaults import patterns, include, url
import sven.anta
# cross apps api pattern!
urlpatterns = patterns('',
	#url(r'^/not-authorized/', 'sven.core.views.notauthorized', name='api_notauthorized'),
	# Examples:
    url(r'^$', 'sven.anta.api.index', name='anta_api_index'),
    
    # url(r'^get-document/(\d+)/$', 'sven.anta.api.get_document', name='anta_api_get_document'),
    
    # url(r'^get-documents/$', 'sven.anta.api.get_documents', name='anta_api_get_documents'),
    
    
    # url(r'^add-relation/$', 'sven.anta.api.add_relation', name='anta_api_add_relation'),
    # url(r'^remove-relation/(\d+)/$', 'sven.anta.api.remove_relation', name='anta_api_remove_relation')
    
    
    # url(r'^svenz/', include('svenz.foo.urls')),
	
	#url(r'^apiz/$', 'sven.anta.views.index', name="anta_api_index"),
	
	
	
	
	
)
