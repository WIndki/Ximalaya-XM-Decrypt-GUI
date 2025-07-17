import { parentPort, workerData } from 'worker_threads'
import { DecryptionService, DecryptionResult } from './decryptionService'

if (!parentPort) {
  throw new Error('This script must be run as a worker thread.')
}

const decryptionService = new DecryptionService()

parentPort.on('message', async (task: { filePath: string, outputDir: string }) => {
  try {
    const result = await decryptionService.decryptFile(
      task.filePath,
      task.filePath.split(/[\\/]/).pop() || task.filePath,
      task.outputDir
    )
    parentPort?.postMessage({ success: true, result })
  } catch (error) {
    parentPort?.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      filename: task.filePath.split(/[\\/]/).pop() || task.filePath
    })
  }
})
