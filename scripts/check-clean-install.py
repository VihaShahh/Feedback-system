"""Validate the pinned backend in a temporary environment, then remove that environment."""

import subprocess
import tempfile
import venv
from pathlib import Path

root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="feedback-clean-install-") as directory:
    venv.create(directory, with_pip=True)
    python = str(Path(directory) / "bin/python")
    for args in [
        [python, "-m", "pip", "install", "-r", str(root / "requirements.lock")],
        [python, "-m", "pip", "install", "-e", str(root), "--no-deps"],
        [python, "-m", "pytest", "-q"],
    ]:
        subprocess.run(args, cwd=root, check=True)
print("Clean backend installation and regression suite passed")
