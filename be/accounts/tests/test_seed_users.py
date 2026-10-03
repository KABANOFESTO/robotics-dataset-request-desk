import json

from django.contrib.auth import get_user_model
from django.core.management import call_command

from accounts.management.commands import seed_users


def test_user_seed_is_idempotent_and_keeps_existing_password(tmp_path, db):
    seed_file = tmp_path / "users.json"
    seed_file.write_text(
        json.dumps(
            [
                {
                    "email": "seed-client@example.com",
                    "password": "seed-password-one",
                    "role": "client",
                    "name": "Seed Client",
                }
            ]
        ),
        encoding="utf-8",
    )

    call_command("seed_users", file=seed_file, verbosity=0)
    user = get_user_model().objects.get(email="seed-client@example.com")
    assert user.check_password("seed-password-one")

    seed_file.write_text(
        json.dumps(
            [
                {
                    "email": "seed-client@example.com",
                    "password": "different-password",
                    "role": "operator",
                    "name": "Changed Seed Name",
                }
            ]
        ),
        encoding="utf-8",
    )
    call_command("seed_users", file=seed_file, verbosity=0)

    user.refresh_from_db()
    assert user.role == "client"
    assert user.check_password("seed-password-one")


def test_user_seed_accepts_json_from_environment(settings, monkeypatch, db):
    monkeypatch.setattr(
        settings,
        "SEED_USERS_JSON",
        json.dumps(
            [
                {
                    "email": "render-seed@example.com",
                    "password": "secure-render-seed-password",
                    "role": "operator",
                    "name": "Render Operator",
                }
            ]
        ),
    )

    call_command("seed_users", verbosity=0)

    user = get_user_model().objects.get(email="render-seed@example.com")
    assert user.role == "operator"
    assert user.check_password("secure-render-seed-password")


def test_development_seed_uses_example_file_when_local_secret_file_is_absent(
    tmp_path,
    settings,
    monkeypatch,
    db,
):
    secret_seed_file = tmp_path / "users.json"
    example_seed_file = tmp_path / "users.example.json"
    example_seed_file.write_text(
        json.dumps(
            [
                {
                    "email": "example-seed@example.com",
                    "password": "local-example-password",
                    "role": "client",
                    "name": "Example Client",
                }
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "DEBUG", True)
    monkeypatch.setattr(seed_users, "DEFAULT_SEED_FILE", secret_seed_file)

    call_command("seed_users", verbosity=0)

    assert get_user_model().objects.filter(email="example-seed@example.com").exists()
