"""Tests for domain skeleton import/shape."""

from importlib import import_module

DOMAINS = [
    "identity",
    "school",
    "course",
    "learning",
    "content",
    "engagement",
    "planner",
    "certification",
    "chatroom",
    "tutorials",
    "research",
    "competitions",
    "specialization",
    "library",
    "course_support",
    "rent_lab",
    "help_support",
]


def test_domain_modules_import_and_expose_expected_symbols() -> None:
    for domain in DOMAINS:
        schemas = import_module(f"app.domain.{domain}.schemas")
        repository = import_module(f"app.domain.{domain}.repository")
        service = import_module(f"app.domain.{domain}.service")

        assert hasattr(schemas, "DomainEntity")
        assert hasattr(repository, "Repository")
        assert hasattr(service, "Service")


# ################################ MODULE ################################
# ################################ /MODULE ################################
