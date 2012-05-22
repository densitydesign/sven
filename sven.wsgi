import os
import sys

path = '/var/www/sven.densitydesign.org'
if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'sven.settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
