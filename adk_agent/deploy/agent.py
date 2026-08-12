import os
import sys
from google.adk import Agent

# Ensure parent directory is in sys.path when loaded standalone by ADK loader
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from adk_agent.tools import audit_github_secrets, audit_hostinger_dns, trigger_github_deploy
from adk_agent.agent import WebAgentState, mcp_tools

model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

root_agent = Agent(
    name="prod_deploy_agent",
    description="Audits GitHub Secrets, DNS, Supabase/Vercel/GitHub via MCP, and triggers CD deployment workflow",
    model=model_name,
    instruction="Audit environment secrets, DNS records, and trigger GitHub Actions deployment.",
    state_schema=WebAgentState,
    tools=[audit_github_secrets, audit_hostinger_dns, trigger_github_deploy] + mcp_tools
)
