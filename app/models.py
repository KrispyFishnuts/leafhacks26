from pydantic import BaseModel
from typing import List


class MarkBreakdownItem(BaseModel):
    criterion: str
    awarded: int
    max: int
    comment: str


class MarkResult(BaseModel):
    total_score: int
    max_score: int
    breakdown: List[MarkBreakdownItem]
    overall_feedback: str