import re
import strawberry
from strawberry.types import Info

def convert_camel_case(name):
    pattern = re.compile(r'(?<!^)(?=[A-Z])')
    name = pattern.sub('_', name).lower()
    return name


def get_selected_fields(info:Info):
    selected_fields = [convert_camel_case(field.name)  for field in info.selected_fields[0].selections]
    return selected_fields


def is_valid_filter(field) -> bool:
    if field is strawberry.UNSET or field is None:
        return False
    
    valid_items = [item for item in field if item is not strawberry.UNSET and item is not None]
    return len(valid_items) > 0