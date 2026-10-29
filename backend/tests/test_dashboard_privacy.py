def test_organization_suppresses_aggregates_until_three_distinct_recipients(sign_in, make_feedback):
    record = make_feedback()
    client = sign_in("senior")
    data = client.get("/api/v1/dashboards/organization").json()
    assert data["suppressed"] and data["sentiment"] is None and data["feedback_count"] is None
    assert record["strengths"] not in str(data) and record["id"] not in str(data)
    make_feedback("peer")
    make_feedback("third", sentiment="balanced")
    data = sign_in("senior").get("/api/v1/dashboards/organization").json()
    assert not data["suppressed"] and data["feedback_count"] == 3
    assert data["sentiment"] == {"positive": 2, "balanced": 1, "needs_attention": 0}
    assert next(row for row in data["departments"] if row["department"] == "Operations")[
        "suppressed"
    ]
