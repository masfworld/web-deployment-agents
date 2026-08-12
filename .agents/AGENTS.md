# Project Rules for Web Deployment Multi-Agent System

## Automatic Memory Generation
- Every multi-agent execution run (via `adk run`, `adk web`, or `npm run agent:orchestrate`) MUST automatically append execution state, agent audit results, and timestamped run logs to `ADK_MEMORY.md`.
- The supervisor agent `web_deployment_supervisor` MUST invoke `save_memory_log` tool at the end of every workflow execution.
