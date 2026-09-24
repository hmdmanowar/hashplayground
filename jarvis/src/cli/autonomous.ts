import { loadConfig } from '../config/config.js'
import { OllamaModel } from '../models/OllamaModel.js'
import { LongTermMemory } from '../memory/LongTermMemory.js'
import { ToolRegistry } from '../tools/registry.js'
import { PermissionEngine } from '../permissions/PermissionEngine.js'
import { Jarvis } from '../core/Jarvis.js'
import { runAutonomousLoop, type CycleResult, type ControlPlane } from '../scheduler/AutonomousWorker.js'

// Only meaningful once this runs somewhere other than your own machine —
// a local Ollama needs no auth, but a future dedicated cloud worker talking
// to Ollama Cloud does. Unset locally, exactly like the interactive CLI.
const ollamaApiKey = process.env.OLLAMA_API_KEY

// Both must be set for the worker to be steered by the admin panel — see
// backend/src/modules/autonomousWorker. Omit either and this behaves
// exactly like the original always-on, locally-reported worker.
const controlPlane: ControlPlane | undefined =
  process.env.JARVIS_CONTROL_PLANE_URL && process.env.JARVIS_CONTROL_PLANE_TOKEN
    ? { baseUrl: process.env.JARVIS_CONTROL_PLANE_URL, token: process.env.JARVIS_CONTROL_PLANE_TOKEN }
    : undefined

async function main() {
  const config = loadConfig()
  // Unattended operation gets a narrower default blast radius than the
  // interactive CLI: confined to jarvis/ unless explicitly overridden via
  // JARVIS_REPO_SCOPE (e.g. to "" to allow the whole repoRoot) — see
  // config.ts's repoScopePath and ToolRegistry's repoScopePath param.
  const repoScopePath = config.repoScopePath ?? 'jarvis'
  const jarvis = new Jarvis(new OllamaModel(config.ollamaHost, config.model, ollamaApiKey), {
    assistantName: config.assistantName,
    longTermMemory: new LongTermMemory(config.memoryDbPath),
    toolRegistry: new ToolRegistry(config.workspaceRoot, config.repoRoot, repoScopePath),
    permissionEngine: new PermissionEngine(config.auditLogPath),
    maxAgentSteps: config.maxAgentSteps,
  })

  console.log(`${jarvis.getAssistantName()} — autonomous worker starting`)
  console.log(`Repo: ${config.repoRoot}${repoScopePath ? ` (scoped to ${repoScopePath}/)` : ''}`)
  console.log(`Branch: ${config.autonomyBranch}`)
  console.log(`Interval: ${Math.round(config.autonomyIntervalMs / 1000)}s`)
  console.log(`Report: ${config.autonomyReportPath}`)
  console.log(controlPlane ? `Control plane: ${controlPlane.baseUrl}` : 'Control plane: none (always on, local report only)')
  console.log('Ctrl+C to stop (the current cycle is allowed to finish first).\n')

  function onCycleComplete(result: CycleResult) {
    console.log(`[cycle ${result.cycleNumber}] ${result.outcome} — ${result.summary}`)
    if (result.detail) console.log(`  ${result.detail}`)
  }

  function onCycleSkipped(reason: string) {
    console.log(`[skipped] ${reason}`)
  }

  await runAutonomousLoop({
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

  console.log('Autonomous worker stopped.')
}

main()
