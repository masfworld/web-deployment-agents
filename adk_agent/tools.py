import subprocess
import socket
import os
import json
import urllib.request

TARGET_APP_DIR = os.environ.get("TARGET_APP_DIR", os.environ.get("KOTRAIL_APP_DIR", "./"))
PROD_APP_URL = os.environ.get("PROD_APP_URL", "https://example.com")
PROD_DOMAIN = os.environ.get("PROD_DOMAIN", os.environ.get("HOSTINGER_DOMAIN", "example.com"))

def run_jest_tests() -> str:
    """Runs Jest unit and component test suites in target application."""
    res = subprocess.run(["npm", "test"], cwd=TARGET_APP_DIR, capture_output=True, text=True)
    return res.stdout + "\n" + res.stderr

def run_playwright_e2e() -> str:
    """Runs Playwright E2E integration test suites in target application."""
    res = subprocess.run(["npm", "run", "test:e2e"], cwd=TARGET_APP_DIR, capture_output=True, text=True)
    return res.stdout + "\n" + res.stderr

def audit_github_secrets() -> str:
    """Audits GitHub Actions production deployment secrets using gh CLI."""
    res = subprocess.run(["gh", "secret", "list"], cwd=TARGET_APP_DIR, capture_output=True, text=True)
    return res.stdout if res.returncode == 0 else res.stderr

def audit_hostinger_dns() -> str:
    """Audits DNS A records for the production domain."""
    try:
        ip_list = socket.gethostbyname_ex(PROD_DOMAIN)[2]
        return f"Domain {PROD_DOMAIN} resolves to IPs: {', '.join(ip_list)}"
    except Exception as e:
        return f"DNS Lookup Failed for {PROD_DOMAIN}: {str(e)}"

def trigger_github_deploy() -> str:
    """Triggers the deploy-production.yml GitHub Actions workflow."""
    res = subprocess.run(["gh", "workflow", "run", "deploy-production.yml"], cwd=TARGET_APP_DIR, capture_output=True, text=True)
    return res.stdout + "\n" + res.stderr if res.returncode == 0 else f"Failed: {res.stderr}"

def probe_production_health() -> str:
    """Probes the live production application URL."""
    try:
        req = urllib.request.Request(PROD_APP_URL, headers={'User-Agent': 'Web-Deployment-Agent'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return f"HTTP {response.status} - OK ({PROD_APP_URL})"
    except Exception as e:
        return f"Health Probe Failed ({PROD_APP_URL}): {str(e)}"

def save_memory_log(qa_passed: bool, preflight_ok: bool, prod_healthy: bool, summary: str) -> str:
    """Appends persistent execution run history, state records, and audit summaries to ADK_MEMORY.md."""
    try:
        from datetime import datetime
        timestamp = datetime.utcnow().isoformat() + "Z"
        status_badge = "✅ PASSED" if (qa_passed and preflight_ok and prod_healthy) else "❌ FAILED"
        memory_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ADK_MEMORY.md"))

        md_content = f"## 🚀 Execution Run: `{timestamp}` ({status_badge})\n\n"
        md_content += f"### 📌 State Summary\n"
        md_content += f"- **QA Suite Passed**: {'✅ Yes' if qa_passed else '❌ No'}\n"
        md_content += f"- **Pre-flight Audit OK**: {'✅ Yes' if preflight_ok else '❌ No'}\n"
        md_content += f"- **Production Healthy**: {'✅ Yes' if prod_healthy else '❌ No'}\n\n"
        md_content += f"### 📊 Execution Summary\n{summary}\n\n---\n\n"

        with open(memory_file, "a", encoding="utf-8") as f:
            f.write(md_content)

        return f"Successfully appended execution memory log to ADK_MEMORY.md at {timestamp}"
    except Exception as e:
        return f"Failed to append memory log to ADK_MEMORY.md: {str(e)}"
