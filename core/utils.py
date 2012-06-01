def is_number( s ):
	s = s.replace("%","")
	try:
		s = int( s )
	except:
		try:
			s = float( s )	
		except:
			return False
	
	return True

def dictfetchall(cursor):
    "Returns all rows from a cursor as a dict"
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]