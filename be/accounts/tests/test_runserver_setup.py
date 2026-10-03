from django.conf import settings

from accounts.management.commands import runserver


def test_development_runserver_applies_migrations_and_seeds_users(
    monkeypatch,
):
    calls = []
    monkeypatch.setattr(settings, "AUTO_SETUP_ON_RUNSERVER", True)
    monkeypatch.delenv("RUN_MAIN", raising=False)
    monkeypatch.setattr(
        runserver,
        "call_command",
        lambda name, **options: calls.append((name, options)),
    )
    monkeypatch.setattr(
        runserver.DjangoRunserverCommand,
        "handle",
        lambda self, *args, **options: "server-started",
    )

    result = runserver.Command().handle(verbosity=0)

    assert result == "server-started"
    assert [name for name, _ in calls] == ["migrate", "seed_users"]


def test_runserver_autoreload_child_does_not_repeat_setup(monkeypatch):
    calls = []
    monkeypatch.setattr(settings, "AUTO_SETUP_ON_RUNSERVER", True)
    monkeypatch.setenv("RUN_MAIN", "true")
    monkeypatch.setattr(
        runserver,
        "call_command",
        lambda *args, **options: calls.append((args, options)),
    )
    monkeypatch.setattr(
        runserver.DjangoRunserverCommand,
        "handle",
        lambda self, *args, **options: "server-started",
    )

    runserver.Command().handle(verbosity=0)

    assert calls == []
