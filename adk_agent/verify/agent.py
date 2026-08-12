import os
import sys
from google.adk import Agent

# Ensure parent directory is in sys.path when loaded standalone by ADK loader
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from adk_agent.tools import probe_production_health
from adk_agent.agent import WebAgentState

model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

root_agent = Agent(
    name="post_deploy_verifier",
    description="Probes production URL health and verifies live deployment",
    model=model_name,
    instruction="""Probe live production URL health using probe_production_health.
Once you receive the probe status (whether HTTP 200 OK or HTTP error/failed), summarize the health probe result clearly and finish your turn immediately to return control back to the supervisor.""",
    state_schema=WebAgentState,
    tools=[probe_production_health]
)
