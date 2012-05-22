from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

import sven

urlpatterns = patterns('',
	# Examples:
    # url(r'^$', 'svenz.views.home', name='home'),
    # url(r'^svenz/', include('svenz.foo.urls')),
	# Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
	# url(r'^$', anta.api.index, name="anta_api_index"),
	# url(r'^/set-relation/corpus/(.?)/', anta.api.set_relation, name="anta_api_set_relation"),
    
    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)