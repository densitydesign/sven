import os, csv, codecs
from optparse import make_option
from datetime import datetime

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
      make_option('--date',
          action='store',
          dest='datefield',
          default=False,
          help='field names for _date_columns. Default: YYYYmmdd'),
      make_option('--text',
          action='store',
          dest='textfields',
          default=False,
          help='comma separated field names for _text_columns. Search for contents inside each column till find something'),
      make_option('--actors',
          action='store',
          dest='actorfields',
          default=False,
          help='comma separated field names for the _actors_ columns. Cell values containing a PIPE char are then splitted'),
      make_option('--tags',
          action='store',
          dest='tagfields',
          default=False,
          help='comma separated field names for the _tag_ columns. Cell values containing a PIPE char are then splitted'),
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
    actors_fields = [i for i in options['actorfields'].split(',')] if options['actorfields'] else []
    tags_fields = [i for i in options['tagfields'].split(',')] if options['tagfields'] else []
    text_field = [i for i in options['textfields'].split(',')]

    
    #
    # 2. get data
    #
    for counter,row in enumerate(c):
      self.stdout.write("\n    (line %s)" % counter)

      title = row['headline']
      filename = slugify('%s %s' % (row['headline'], counter))
      content = ''

      # recursive search for text
      for candidate in text_field:
        if len(content) < len(row.get(candidate)):
          content = row.get(candidate)

      if not len(content):
        raise CommandError("\n    Aborted. Content at this line does not contain anything!")
        continue
      
      date = datetime.strptime(row.get(options['datefield']),'%Y%m%d')
      actors = [row.get(a) for a in actors_fields]
      tags = [row.get(t).split('|') for t in tags_fields]
      self.stdout.write("\n    title: %s, datetime: %s" % (title, date))

      
      
      # check everything before doing strange stuff
      if counter == 0:
        self.stdout.write("\n    actors fields: %s" % (', '.join(actors)))
        self.stdout.write("\n    tags fields ")
        print tags
        self.stdout.write("\n    content sample: %s" % content)

        while True:
          accept = raw_input('\n\nType Y if fields/value above are correct, any key otherwise...')
          if accept.upper() == 'Y':
            break
          else:
            raise CommandError("\n    Aborted.")

      
      
      filepath = os.path.join(corpus_path, filename + '.txt')

      try:
        d = Document.objects.get(url=os.path.basename(filepath))
      except Document.DoesNotExist, e:
        f = codecs.open(filepath, encoding='utf-8', mode='w')
        f.write(content)

        d = Document(title=title, corpus=corpus, language='EN', mime_type="text/plain", status=Document.STATUS_NEW, url=os.path.basename(filepath))
        
        d.save()

        self.stdout.write("\n        document %s created" % d.title)

      for actor_name in actors:
        if len(actor_name):
          t,created = Tag.objects.get_or_create(name=actor_name, type='actor')
          self.stdout.write("\n        tag:actor %s created" % actor_name)
          Document_Tag.objects.get_or_create(document=d, tag=t)

      for tag_collection in tags:        
        for tag_name in tag_collection:
          if len(tag_name):
            t,created = Tag.objects.get_or_create(name=tag_name.lower(), type='keyword')
            #self.stdout.write("\n        tag:%s %s created" % (t, tag_name))
            Document_Tag.objects.get_or_create(document=d, tag=t)

      if date:
        d.ref_date = date
        d.save()

    self.stdout.write("\n\n-----------  finish  ---------------------\n\n")


def get_corpus_path(corpus):
  return os.path.join(settings.MEDIA_ROOT, corpus.name)

def unicode_dict_reader(utf8_data, **kwargs):
    csv_reader = csv.DictReader(utf8_data, **kwargs)
    for row in csv_reader:
        yield dict([(key, unicode(value, 'utf-8')) for key, value in row.iteritems()])