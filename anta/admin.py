from django.contrib import admin
from sven.anta.models import Document, Corpus, Routine, Analysis, Owners

admin.site.register(Analysis)
admin.site.register(Routine)
admin.site.register(Document)
admin.site.register(Corpus)
admin.site.register(Owners)