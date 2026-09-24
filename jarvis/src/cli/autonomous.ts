import { loadConfig } from '../config/config.js'
import { OllamaModel } from '../models/OllamaModel.js'
import { LongTermMemory } from '../memory/LongTermMemory.js'
import { ToolRegistry } from '../tools/registry.js'
import { PermissionEngine } from '../permissions/PermissionEngine.js'
import { Jarvis } from '../core/Jarvis.js'
import { runAutonomousLoop, type CycleResult } from '../scheduler/AutonomousWorker.js'

async function main() {
  const config = loadConfig()
  // Unattended operation gets a narrower default blast radius than the
  // interactive CLI: confined to jarvis/ unless explicitly overridden via
  // JARVIS_REPO_SCOPE (e.g. to "" to allow the whole repoRoot) — see
  // config.ts's repoScopePath and ToolRegistry's repoScopePath param.
  const repoScopePath = config.repoScopePath ?? 'jarvis'
  const jarvis = new Jarvis(new OllamaModel(config.ollamaHost, config.model), {
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
  console.log('Ctrl+C to stop (the current cycle is allowed to finish first).\n')

  function onCycleComplete(result: CycleResult) {
    console.log(`[cycle ${result.cycleNumber}] ${result.outcome} — ${result.summary}`)
    if (result.detail) console.log(`  ${result.detail}`)
  }

  await runAutonomousLoop({
    jarvis,
    repoRoot: config.repoRoot,
    repoScopePath,
    branch: config.autonomyBranch,
    intervalMs: config.autonomyIntervalMs,
    reportPath: config.autonomyReportPath,
    onCycleComplete,
  })

  console.log('Autonomous worker stopped.')
}

main()
