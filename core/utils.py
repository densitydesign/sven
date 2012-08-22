def is_number(s):
    s = s.replace("%", "")
    try:
        s = float(s)  # float() works iwth both integer-like and float-like strings.
    except ValueError:
        return False
    return True


def dictfetchall(cursor):
    "Returns all rows from a cursor as a dict"
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]
