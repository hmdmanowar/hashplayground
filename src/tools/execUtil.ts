import { spawn } from 'node:child_process'

export interface CommandResult {
  exitCode: number | null
  stdout: string
  stderr: string
}

// Shared process-spawning helper for the Phase 6 repo tools (GitTools.ts,
// DevTools.ts). Defaults to shell:false + an argv array so tool arguments
// (branch names, commit messages, refs) are passed as discrete parameters
// and can never be reinterpreted as shell syntax or extra flags — unlike
// TerminalTool.ts's run_command, which is deliberately a raw shell string
// (that's the whole point of it being the one high-risk, always-approved
// tool). DevTools.ts opts into shell:true only for its two fixed, literal
// npm commands, which take no user input at all.
export function runProcess(
  file: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
  maxOutputChars: number,
  shell = false,
): Promise<CommandResult> {
  return new Promise<CommandResult>((resolvePromise, reject) => {
    const child = spawn(file, args, { cwd, shell, timeout: timeoutMs })

    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', (code, signal) => {
      if (signal === 'SIGTERM') {
        reject(new Error(`Command timed out after ${timeoutMs}ms`))
        return
      }
      resolvePromise({
        exitCode: code,
        stdout: stdout.slice(0, maxOutputChars),
        stderr: stderr.slice(0, maxOutputChars),
      })
    })
  })
}
