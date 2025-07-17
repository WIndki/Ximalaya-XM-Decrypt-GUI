// 验证优化后的 DecryptionWorkerService
import { DecryptionWorkerService } from './electron/services/decryptionManager'
import path from 'path'

// 创建实例
const decryptionManager = new DecryptionWorkerService()

// 测试事件监听
decryptionManager.on('progress', (progress) => {
  console.log('Progress:', progress)
})

decryptionManager.on('result', (result) => {
  console.log('Result:', result)
})

decryptionManager.on('complete', () => {
  console.log('All files processed')
  decryptionManager.cleanup()
})

decryptionManager.on('error', (error) => {
  console.error('Error:', error)
  decryptionManager.cleanup()
})

// 测试解密
const testFiles = [
  // 添加测试文件路径
]

const outputDir = path.join(process.cwd(), 'test-output')

if (testFiles.length > 0) {
  decryptionManager.decryptFiles(testFiles, outputDir)
} else {
  console.log('No test files specified')
  decryptionManager.cleanup()
}
