import { Worker } from 'worker_threads'
import path from 'path'
import { EventEmitter } from 'events'
import { DecryptionResult } from './decryptionService'

export class DecryptionWorkerService extends EventEmitter {
  private worker: Worker | null = null
  private processedCount: number = 0
  private totalFiles: number = 0
  private isTerminating: boolean = false

  constructor() {
    super()
    // 在主线程中创建工作线程
    this.worker = new Worker(path.join(__dirname, 'decryptionWorker.js'))
    this.setupWorkerListeners()
  }

  private setupWorkerListeners() {
    this.worker?.on('message', (message: { success: boolean, result?: DecryptionResult, error?: string, filename?: string }) => {
      this.processedCount++
      
      let result: DecryptionResult
      if (message.success && message.result) {
        result = message.result
      } else {
        result = {
          filename: message.filename || 'Unknown file',
          success: false,
          error: message.error || 'Unknown worker error'
        }
      }
      
      // 发射事件而不是调用回调
      this.emit('result', result)
      this.emit('progress', { 
        processed: this.processedCount, 
        total: this.totalFiles, 
        filename: result.filename 
      })

      if (this.processedCount === this.totalFiles) {
        this.emit('complete')
      }
    })

    this.worker?.on('error', (error) => {
      console.error('Worker error:', error)
      this.emit('error', error)
    })

    this.worker?.on('exit', (code) => {
      // 只有在非主动终止且退出码不为0时才发出错误
      if (code !== 0 && !this.isTerminating) {
        console.error(`Worker stopped with exit code ${code}`)
        this.emit('error', new Error(`Worker stopped with exit code ${code}`))
      }
    })
  }

  public decryptFiles(
    filePaths: string[],
    outputDir: string
  ): void {
    // 重置计数器
    this.processedCount = 0
    this.totalFiles = filePaths.length
    
    // 将文件逐个发送给工作线程处理
    filePaths.forEach(filePath => {
      this.worker?.postMessage({ filePath, outputDir })
    })
  }

  public async cleanup(): Promise<void> {
    if (this.worker) {
      this.isTerminating = true
      try {
        await this.worker.terminate()
      } catch (error) {
        console.error('Error terminating worker:', error)
      } finally {
        this.worker = null
        this.isTerminating = false
      }
    }
  }
}
