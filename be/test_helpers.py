import json


def post_json(client, url, data):
    return client.post(url, data=json.dumps(data), content_type="application/json")
