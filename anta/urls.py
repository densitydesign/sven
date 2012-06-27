from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

import sven

urlpatterns = patterns('',
	url(r'^$', 'sven.anta.views.index', name='anta_index'),
	url(r'^login/$', 'sven.anta.views.login_view', name='anta_login'),
	url(r'^logout/$', 'sven.anta.views.logout_view', name='anta_logout'),
	# Examples:
    # url(r'^$', 'svenz.views.home', name='home'),
    # url(r'^svenz/', include('svenz.foo.urls')),
	# Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
	# url(r'^$', anta.api.index, name="anta_api_index"),
	# url(r'^/set-relation/corpus/(.?)/', anta.api.set_relation, name="anta_api_set_relation"),
    
    # api
    url(r'^api/access-denied/$', 'sven.anta.api.access_denied', name='anta_api_access_denied' ),
    url(r'^api/login-requested/$', 'sven.anta.api.login_requested', name='anta_api_login_requested' ),
    url(r'^api/dummy-gummy/$', 'sven.anta.api.dummy_gummy', name='anta_api_dummy_gummy' ),
    url(r'^api/logout/$', 'sven.anta.api.logout_view', name='anta_api_logout_view' ),
   
    
    
    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)