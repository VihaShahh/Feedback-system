import csv
import io

from backend.app.models import Grant


def test_csv_requires_export_grant_preserves_scope_and_escapes_spreadsheet_formulas(
    sign_in, make_feedback, app
):
    record = make_feedback()
    make_feedback("outsider")
    make_feedback(publish=False)
    client = sign_in("manager")
    assert client.get("/api/v1/reports/feedback.csv").status_code == 403
    assert (
        client.patch(
            f"/api/v1/feedback/{record['id']}",
            json={
                "version": 2,
                "strengths": "=1+1",
                "improvements": "@malicious",
                "sentiment": "balanced",
            },
        ).status_code
        == 200
    )
    with app.state.sessions.begin() as db:
        db.add(Grant(user_id="manager", permission="feedback.export"))
    response = client.get("/api/v1/reports/feedback.csv")
    assert response.status_code == 200 and "attachment" in response.headers["content-disposition"]
    rows = list(csv.reader(io.StringIO(response.text)))
    assert len(rows) == 2 and rows[1][0] == "Employee"
    assert rows[1][2] == "'=1+1" and rows[1][3] == "'@malicious"
