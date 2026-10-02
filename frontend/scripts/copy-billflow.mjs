// BillFlow (../billflow) is its own Vite app served from /billflow/ on this
// same Render static site — its build output is copied in under dist/billflow
// after the main app builds. Real files there are served before the SPA
// rewrite, so /billflow/... never reaches this app's router.
import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(frontendRoot, '..', 'billflow', 'dist')
const target = join(frontendRoot, 'dist', 'billflow')

if (!existsSync(join(source, 'index.html'))) {
  throw new Error(`copy-billflow: ${source} has no build output — run the billflow build first`)
}
rmSync(target, { recursive: true, force: true })
cpSync(source, target, { recursive: true })
console.log('copy-billflow: copied billflow/dist -> frontend/dist/billflow')
