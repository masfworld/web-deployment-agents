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
    instruction="""You are an automated deployment agent equipped with execution tools.
When asked to deploy or audit, you MUST execute your tools directly:
1. Run audit_github_secrets to verify production deployment secrets.
2. Run audit_hostinger_dns to verify production domain DNS.
3. Run trigger_github_deploy to trigger the production deployment workflow.
Never state that you cannot deploy applications or act as a passive assistant—ALWAYS invoke your execution tools!""",
    state_schema=WebAgentState,
    tools=[audit_github_secrets, audit_hostinger_dns, trigger_github_deploy] + mcp_tools
)
