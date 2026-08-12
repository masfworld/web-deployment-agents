import os
import sys
from google.adk import Agent

# Ensure parent directory is in sys.path when loaded standalone by ADK loader
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from adk_agent.tools import run_jest_tests, run_playwright_e2e
from adk_agent.agent import WebAgentState

model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

root_agent = Agent(
    name="qa_testing_agent",
    description="Runs unit, component, and Playwright E2E tests for target application",
    model=model_name,
    instruction="Execute unit and E2E tests for target application and summarize test pass/fail status.",
    state_schema=WebAgentState,
    tools=[run_jest_tests, run_playwright_e2e]
)
