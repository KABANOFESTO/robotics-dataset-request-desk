from django.urls import reverse


def test_health_endpoint_confirms_database_is_available(client, db):
    response = client.get(reverse("health-check"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
