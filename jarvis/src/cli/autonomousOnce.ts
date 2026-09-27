import { loadConfig } from '../config/config.js'
import { OllamaModel } from '../models/OllamaModel.js'
import { LongTermMemory } from '../memory/LongTermMemory.js'
import { ToolRegistry } from '../tools/registry.js'
import { PermissionEngine } from '../permissions/PermissionEngine.js'
import { Jarvis } from '../core/Jarvis.js'
import { runOnce, type CycleResult, type ControlPlane } from '../scheduler/AutonomousWorker.js'

// The single-run counterpart to cli/autonomous.ts's infinite loop — meant
// for a scheduler that isn't itself a long-lived process (a GitHub Actions
// cron job, notably): does one poll-and-maybe-work-and-report cycle, then
// exits. See jarvis/README.md for the full env var list this expects.
const ollamaApiKey = process.env.OLLAMA_API_KEY
const ollamaTimeoutMs = Number(process.env.JARVIS_AUTONOMY_OLLAMA_TIMEOUT_MS ?? 180_000)

const controlPlane: ControlPlane | undefined =
  process.env.JARVIS_CONTROL_PLANE_URL && process.env.JARVIS_CONTROL_PLANE_TOKEN
    ? { baseUrl: process.env.JARVIS_CONTROL_PLANE_URL, token: process.env.JARVIS_CONTROL_PLANE_TOKEN }
    : undefined

async function main() {
  if (!controlPlane) {
    console.error(
      'autonomous:once requires JARVIS_CONTROL_PLANE_URL and JARVIS_CONTROL_PLANE_TOKEN — ' +
        'there is no "always on, explore forever" mode that makes sense for a single bounded run.',
    )
    process.exitCode = 1
    return
  }

  const config = loadConfig()
  const repoScopePath = config.repoScopePath ?? 'jarvis'
  const jarvis = new Jarvis(new OllamaModel(config.ollamaHost, config.model, ollamaApiKey, ollamaTimeoutMs), {
    assistantName: config.assistantName,
    longTermMemory: new LongTermMemory(config.memoryDbPath),
    toolRegistry: new ToolRegistry(config.workspaceRoot, config.repoRoot, repoScopePath),
    permissionEngine: new PermissionEngine(config.auditLogPath),
    maxAgentSteps: config.maxAgentSteps,
  })

  console.log(`${jarvis.getAssistantName()} — autonomous worker (single run)`)
  console.log(`Repo: ${config.repoRoot}${repoScopePath ? ` (scoped to ${repoScopePath}/)` : ''}`)
  console.log(`Branch: ${config.autonomyBranch}`)
  console.log(`Control plane: ${controlPlane.baseUrl}`)

  function onCycleComplete(result: CycleResult) {
    console.log(`[cycle] ${result.outcome} — ${result.summary}`)
    if (result.detail) console.log(`  ${result.detail}`)
  }

  function onCycleSkipped(reason: string) {
    console.log(`[skipped] ${reason}`)
  }

  const outcome = await runOnce({
    jarvis,
    repoRoot: config.repoRoot,
    repoScopePath,
    branch: config.autonomyBranch,
    intervalMs: config.autonomyIntervalMs,
    reportPath: config.autonomyReportPath,
    controlPlane,
    onCycleComplete,
    onCycleSkipped,
  })

  // A skipped or reported (even 'error') outcome is an ordinary, expected
  // result, not a process failure — only an uncaught exception outside
  // runOnce's own try/catch (which there shouldn't be) would exit non-zero.
  console.log(outcome.skipped ? 'Nothing to do this run.' : 'Run complete.')
}

main()
