import os, csv, codecs
from optparse import make_option

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.template.defaultfilters import slugify
from django.core.files import File
from anta.models import Corpus, Document, Tag, Document_Tag


class Command(BaseCommand):
  args = '<csv absolute path>'
  help = 'Import a list of user from a csv file along with their Affiliation. Csv file must be comma separated, and affiliation name must be a group name'
  option_list = BaseCommand.option_list + (
      make_option('--csv',
          action='store',
          dest='csv',
          default=False,
          help='csv file of references'),
      make_option('--owner',
          action='store',
          dest='owner',
          default=False,
          help='owner username'),
      make_option('--corpus',
          action='store',
          dest='corpus',
          default=False,
          help='corpus name'),
  )

  def handle(self, *args, **options):
    self.stdout.write("\n------------------------------------------\n\n    welcome to loadcorpus script\n    ==================================\n\n\n\n")
    self.stdout.write("    loading file %s" % options['csv'])
    
    if not os.path.exists(options['csv']):
      self.stdout.write("\n    file %s not found" % options['csv'])
      return
    
    f = open(options['csv'], 'rb')
    c = unicode_dict_reader(f, delimiter='\t')
    
    #
    # 1. find corpus
    #
    try:
      corpus = Corpus.objects.get(name=options['corpus'])
    except Corpus.DoesNotExist, e:
      raise CommandError("\n    ouch. Try again, corpus %s does not exist!" % options['corpus'])
    
    self.stdout.write("\n    working on corpus %s:%s" % (corpus.id, corpus.name))
    
    # @todo put get path into model
    corpus_path = get_corpus_path(corpus)
    
    # actors and tags (csv header)
    actors_fields = ('City', 'Country', 'Year')

    #
    # 2. get data
    #
    for counter,row in enumerate(c):
      self.stdout.write("\n    (line %s)" % counter)
      title = slugify('%s %s' % (row['itle'], row['id']))
      content = row['text']


      filepath = os.path.join(corpus_path, title + '.txt')

      try:
        d = Document.objects.get(title=title)
      except Document.DoesNotExist, e:
        f = codecs.open(filepath, encoding='utf-8', mode='w')
        f.write(content)

        d = Document(title=title, corpus=corpus, language='en', mime_type="text/plain", url=os.path.basename(filepath))
        
        d.save()

        self.stdout.write("\n        document %s created" % d.title)

      for a in actors_fields:
        actor_name = row.get(a)

        if len(actor_name):
          t,created = Tag.objects.get_or_create(name=actor_name, type='actor')
          self.stdout.write("\n        tag:actor %s created" % actor_name)
          Document_Tag.objects.get_or_create(document=d, tag=t)

    self.stdout.write("\n\n-----------  finish  ---------------------\n\n")


def get_corpus_path(corpus):
  return os.path.join(settings.MEDIA_ROOT, corpus.name)

def unicode_dict_reader(utf8_data, **kwargs):
    csv_reader = csv.DictReader(utf8_data, **kwargs)
    for row in csv_reader:
        yield dict([(key, unicode(value, 'utf-8')) for key, value in row.iteritems()])