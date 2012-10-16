from django import template
import hashlib

register = template.Library()

@register.filter
def gravatar( email ):
	
	host = "http://www.gravatar.com/avatar/"
	
	hash = hashlib.md5( email ).hexdigest()
   	
	return host + hash + "?s=32&d=retro"
 


@register.filter
def delta( date_a, date_b ):
	# return days, and/or weeks
	delta = date_b - date_a
	weeks = delta.days / 7
	days = delta.days % 7
	
	if weeks > 1:
		if days == 0:
			return str( weeks ) + ' weeks'
		if days == 1:
			return str( weeks ) + ' weeks, 1 day'
		return str( weeks ) + ' weeks, ' + str( days ) + ' days'
	
	return str( days ) + ' days' if days > 1 else '1 day'

#
# verbatim template tag django version < django 1.5
# cfr https://gist.github.com/1313862
#
class VerbatimNode(template.Node):
	def __init__(self, text):
		self.text = text
	def render(self, context):
		return self.text

@register.tag
def verbatim(parser, token):
    text = []
    while 1:
        token = parser.tokens.pop(0)
        if token.contents == 'endverbatim':
            break
        if token.token_type == template.TOKEN_VAR:
            text.append('{{')
        elif token.token_type == template.TOKEN_BLOCK:
            text.append('{%')
        text.append(token.contents)
        if token.token_type == template.TOKEN_VAR:
            text.append('}}')
        elif token.token_type == template.TOKEN_BLOCK:
            text.append('%}')
    return VerbatimNode(''.join(text))