import pytest
from pydantic import ValidationError

from backend.app.feedback_schemas import FeedbackCreate


@pytest.mark.parametrize(
    "change",
    [
        {"strengths": " "},
        {"improvements": ""},
        {"sentiment": "excellent"},
        {"role": "admin"},
        {"strengths": "x" * 4001},
    ],
)
def test_feedback_requires_bounded_content_and_known_sentiment(change):
    with pytest.raises(ValidationError):
        FeedbackCreate(
            **(
                {
                    "employee_id": "employee",
                    "strengths": "Helpful ownership",
                    "improvements": "More documentation",
                    "sentiment": "positive",
                }
                | change
            )
        )
