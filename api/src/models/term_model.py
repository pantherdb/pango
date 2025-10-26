from typing import Optional
import strawberry
from src.models.base_model import Frequency

@strawberry.type
class Term:
    id: str
    label: Optional[str] = ""
    display_id: Optional[str] = ""
    aspect: Optional[str] = ""
    is_goslim: Optional[bool] = False
    count: Optional[int] = 0
    evidence_type:Optional[str] = None


@strawberry.type
class TermStats:
    term_frequency: Frequency
    
