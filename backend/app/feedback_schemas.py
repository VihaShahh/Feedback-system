from typing import Literal

from pydantic import Field

from .schemas import Input, Text, VersionInput

Sentiment = Literal["positive", "balanced", "needs_attention"]
FeedbackState = Literal["draft", "published", "archived"]


class FeedbackContent(Input):
    strengths: Text
    improvements: Text
    sentiment: Sentiment


class FeedbackCreate(FeedbackContent):
    employee_id: str = Field(min_length=1, max_length=36)
    cycle_id: str | None = Field(default=None, min_length=1, max_length=36)


class FeedbackEdit(FeedbackContent, VersionInput):
    pass


class CommentInput(Input):
    body: str = Field(min_length=1, max_length=2000)


class EscalationInput(VersionInput):
    note: str = Field(min_length=5, max_length=2000)


class ResolutionInput(Input):
    note: str = Field(min_length=5, max_length=2000)
