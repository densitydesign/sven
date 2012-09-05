from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
	url(r'^anta/', include('sven.anta.urls')),
	url(r'^api/anta/', include('sven.core.urls')), # anta api
	url(r'^gui/', include('sven.gui.urls')), # sven gui
	url(r'^$', 'sven.gui.views.documents', name='sven_documents' ), # sven gui
	
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
