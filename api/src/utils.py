import re
from strawberry.types import Info

def convert_camel_case(name):
    pattern = re.compile(r'(?<!^)(?=[A-Z])')
    name = pattern.sub('_', name).lower()
    return name

def get_selected_fields(info:Info):
    selected_fields = [convert_camel_case(field.name)  for field in info.selected_fields[0].selections]
    return selected_fields

