# SPDX-License-Identifier: Apache-2.0

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]


def run_cli(*args: str) -> dict | list:
    env = os.environ.copy()
    pythonpath = [
        str(ROOT / "apps" / "cli" / "src"),
        str(ROOT / "apps" / "api" / "src"),
        env.get("PYTHONPATH", ""),
    ]
    env["PYTHONPATH"] = os.pathsep.join(path for path in pythonpath if path)
    result = subprocess.run(
        [sys.executable, "-m", "basar_cli.main", *args],
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)


def test_doctor_reports_ready(tmp_path: Path) -> None:
    payload = run_cli("doctor", "--database", str(tmp_path / "basar.sqlite"), "--archive-dir", str(tmp_path / "archive"))

    assert payload["ok"] is True
    assert {check["name"] for check in payload["checks"]} >= {
        "database_path_ready",
        "security_boundary_present",
        "sqlite_fts5_available",
    }


def test_demo_search_ask_export_workflow(tmp_path: Path) -> None:
    database = tmp_path / "basar.sqlite"
    archive = tmp_path / "archive"
    export_path = tmp_path / "library.json"

    demo = run_cli("demo", "--database", str(database), "--archive-dir", str(archive))
    assert demo["ok"] is True
    assert demo["source"]["id"].startswith("src_")
    assert demo["answer"]["citations"]

    status = run_cli("status", "--database", str(database), "--archive-dir", str(archive))
    assert status["database"]["source_count"] == 1

    search = run_cli("search", "--database", str(database), "--limit", "1", "evidence")
    assert len(search) == 1
    assert search[0]["id"] == demo["source"]["id"]

    archive_result = run_cli("archive-to-0g", "--database", str(database), demo["source"]["id"])
    assert archive_result["dry_run"] is True
    assert archive_result["archived_uri"].startswith("0g://dry-run/")

    export_result = run_cli("export", "--database", str(database), "--output", str(export_path))
    assert export_result["ok"] is True
    assert export_result["sources"] == 1
    assert json.loads(export_path.read_text(encoding="utf-8"))["sources"][0]["id"] == demo["source"]["id"]
