import os
import sys
from typing import Dict, Any
from pydantic import BaseModel, Field
from google.adk import Agent

# Ensure root folder is in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

# 1. State Schema: Shared state passed between ADK Agents during execution
class WebAgentState(BaseModel):
    qa_passed: bool = Field(default=False, description="Whether Phase 1 QA tests passed")
    preflight_ok: bool = Field(default=False, description="Whether Phase 2 preflight audit passed")
    deployment_id: str = Field(default="", description="ID of triggered deployment workflow")
    prod_healthy: bool = Field(default=False, description="Whether Phase 3 post-deploy health check passed")
    last_audit_summary: str = Field(default="", description="Summary of last preflight audit")

from adk_agent.tools import (
    run_jest_tests,
    run_playwright_e2e,
    audit_github_secrets,
    audit_hostinger_dns,
    trigger_github_deploy,
    probe_production_health,
    run_qa_testing_phase,
    run_production_deployment_phase,
    run_post_deployment_verification_phase,
    save_memory_log
)

# Optional MCP Toolset Integration (Supabase, GitHub, Vercel)
mcp_tools = []

try:
    from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
    from mcp import StdioServerParameters

    # 1. Supabase MCP Server
    supabase_access_token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    supabase_project_ref = os.environ.get("SUPABASE_PROJECT_REF", "")
    if supabase_access_token:
        try:
            supa_params = StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="npx",
                    args=["-y", "@supabase/mcp-server-supabase"],
                    env={
                        "SUPABASE_ACCESS_TOKEN": supabase_access_token,
                        "SUPABASE_PROJECT_REF": supabase_project_ref
                    }
                )
            )
            mcp_tools.append(McpToolset(connection_params=supa_params))
            print("Successfully registered Supabase MCP Server toolset.")
        except Exception as e:
            print(f"Warning: Could not initialize Supabase MCP toolset: {e}")

    # 2. GitHub MCP Server
    github_token = os.environ.get("GITHUB_TOKEN", os.environ.get("GH_TOKEN", ""))
    if not github_token:
        try:
            import subprocess
            res = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True)
            if res.returncode == 0 and res.stdout.strip():
                github_token = res.stdout.strip()
        except Exception:
            pass

    if github_token:
        try:
            gh_params = StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="npx",
                    args=["-y", "@modelcontextprotocol/server-github"],
                    env={"GITHUB_PERSONAL_ACCESS_TOKEN": github_token}
                )
            )
            mcp_tools.append(McpToolset(connection_params=gh_params))
            print("Successfully registered GitHub MCP Server toolset.")
        except Exception as e:
            print(f"Warning: Could not initialize GitHub MCP toolset: {e}")

    # 3. Vercel MCP Server
    vercel_token = os.environ.get("VERCEL_TOKEN", os.environ.get("VERCEL_API_TOKEN", ""))
    if vercel_token:
        try:
            vercel_params = StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="npx",
                    args=["-y", "@open-mcp/vercel"],
                    env={"VERCEL_API_TOKEN": vercel_token}
                )
            )
            mcp_tools.append(McpToolset(connection_params=vercel_params))
            print("Successfully registered Vercel MCP Server toolset.")
        except Exception as e:
            print(f"Warning: Could not initialize Vercel MCP toolset: {e}")

except ImportError as e:
    print(f"Warning: MCP tools error: {e}")

# Agent 1: QA & Testing Agent
qa_agent = Agent(
    name="qa_testing_agent",
    description="Runs unit, component, and Playwright E2E tests for target application",
    model=model_name,
    instruction="""Execute unit and E2E tests for the target web application using run_jest_tests and run_playwright_e2e.
Once tests finish, summarize the test pass/fail results in plain text and finish your turn. Do NOT generate duplicate tool calls or repeat transfer_to_agent.""",
    state_schema=WebAgentState,
    tools=[run_jest_tests, run_playwright_e2e]
)

# Agent 2: Deployment & Pre-Flight Agent
deploy_agent = Agent(
    name="prod_deploy_agent",
    description="Audits GitHub Secrets, DNS, Supabase DB, GitHub & Vercel via MCP, and triggers CD deployment workflow",
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

# Agent 3: Post-Deployment Verification Agent
verifier_agent = Agent(
    name="post_deploy_verifier",
    description="Probes production URL health and verifies live deployment",
    model=model_name,
    instruction="""Probe live production URL health using probe_production_health.
Once you receive the probe status (whether HTTP 200 OK or HTTP error/failed), summarize the health probe result in text and finish your turn immediately. Do NOT repeat tool calls or transfer_to_agent.""",
    state_schema=WebAgentState,
    tools=[probe_production_health]
)

# Root Supervisor Agent
root_agent = Agent(
    name="web_deployment_supervisor",
    description="Supervisor Agent orchestrating QA testing, production deployment, and post-deploy verification",
    model=model_name,
    instruction="""You are the Web Deployment ADK Supervisor Agent.
Orchestrate multi-phase deployment using your phase tools or sub-agents:

Phase Execution Tools:
1. To run unit & E2E tests -> Call run_qa_testing_phase() or transfer_to_agent(agent_name="qa_testing_agent").
2. To audit secrets, DNS & deploy to production -> Call run_production_deployment_phase() or transfer_to_agent(agent_name="prod_deploy_agent").
3. To probe live production health -> Call run_post_deployment_verification_phase() or transfer_to_agent(agent_name="post_deploy_verifier").
4. To persist execution memory log -> Call save_memory_log().

ALWAYS invoke the appropriate tool or sub-agent immediately when requested!""",
    state_schema=WebAgentState,
    sub_agents=[qa_agent, deploy_agent, verifier_agent],
    tools=[
        run_qa_testing_phase,
        run_production_deployment_phase,
        run_post_deployment_verification_phase,
        save_memory_log
    ]
)
