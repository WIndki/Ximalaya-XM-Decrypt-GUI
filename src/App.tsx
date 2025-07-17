import React, { useState, useEffect, useCallback, useRef } from 'react'
import TitleBar from './components/TitleBar'
import VirtualizedList from './components/VirtualizedList'
import ResultsList from './components/ResultsList'
import { 
  Button, 
  ButtonGroup, 
  Progress, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Chip,
  Badge
} from '@heroui/react'

interface DecryptionResult {
  filename: string
  success: boolean
  outputPath?: string
  error?: string
  metadata?: {
    title?: string
    artist?: string
    album?: string
    trackNumber?: number
    format?: string
    size?: number
  }
}

interface FileInfo {
  name: string
  path: string
  size: number
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [outputDir, setOutputDir] = useState<string | undefined>()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [progress, setProgress] = useState({ processed: 0, total: 0, filename: '' })
  const [results, setResults] = useState<DecryptionResult[]>([])
  const [dragOver, setDragOver] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleSelectFiles = async () => {
    const files = await window.api.selectFiles()
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }

  const handleSelectFolder = async () => {
    const files = await window.api.selectFolderForFiles()
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const handleSelectOutputDir = async () => {
    const dir = await window.api.selectOutputDirectory()
    if (dir) {
      setOutputDir(dir)
    }
  }

  const handleDecrypt = useCallback(async () => {
    if (selectedFiles.length === 0) {
      alert('请先选择XM文件')
      return
    }

    setIsDecrypting(true)
    setResults([])
    setProgress({ processed: 0, total: selectedFiles.length, filename: '' })

    try {
      await window.api.decryptFiles(selectedFiles, outputDir)
    } catch (error) {
      console.error('解密失败:', error)
      alert('解密失败，请检查文件格式和权限')
    }
  }, [selectedFiles, outputDir])

  // 监听解密进度
  useEffect(() => {
    const removeProgressListener = window.api.onDecryptProgress((event, progressUpdate) => {
      setProgress(progressUpdate)
    })

    const removeResultListener = window.api.onDecryptResult((event, result) => {
      setResults(prevResults => [...prevResults, result])
    })

    return () => {
      removeProgressListener()
      removeResultListener()
    }
  }, [])

  useEffect(() => {
    if (progress.processed === progress.total && progress.total > 0) {
      setIsDecrypting(false)
    }
  }, [progress])

  // 文件拖拽处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 检查是否有文件被拖拽
    if (e.dataTransfer.types.includes('Files')) {
      setDragOver(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 使用 currentTarget 和 relatedTarget 来检查是否真的离开了拖拽区域
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    // 检查鼠标是否在拖拽区域之外
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const filePaths: string[] = []

    for (const file of files) {
      try {
        // 使用新的 webUtils.getPathForFile 方法获取文件路径
        const filePath = window.api.getPathForFile(file)
        
        if (!filePath) {
          console.error('无法获取文件路径:', file.name)
          alert(`无法获取文件 "${file.name}" 的完整路径。请使用文件选择按钮选择文件。`)
          continue
        }

        // 检查是否是文件夹
        if (file.type === '' && file.size === 0) {
          // 可能是文件夹，使用API扫描
          try {
            const folderFiles = await window.api.scanFolder(filePath)
            filePaths.push(...folderFiles)
          } catch (error) {
            console.error('扫描文件夹时出错:', error)
          }
        } else if (file.name.toLowerCase().endsWith('.xm')) {
          // 直接是.xm文件
          filePaths.push(filePath)
        }
      } catch (error) {
        console.error('获取文件路径时出错:', error)
        alert(`获取文件 "${file.name}" 路径时出错。请使用文件选择按钮选择文件。`)
      }
    }

    if (filePaths.length > 0) {
      // 去重
      const uniqueFiles = Array.from(new Set([...selectedFiles, ...filePaths]))
      setSelectedFiles(uniqueFiles)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setSelectedFiles([])
    setResults([])
  }

  const handleOpenOutputFolder = async () => {
    if (outputDir) {
      try {
        await window.api.showItemInFolder(outputDir)
      } catch (error) {
        console.error('Error opening output folder:', error)
      }
    }
  }

  const progressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0

  // 防止在页面其他地方拖拽时触发默认行为
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-8"
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
    >
      <TitleBar />
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🎵 喜马拉雅音频解密工具
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              一键解密XM格式音频文件到常见音频格式
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 flex flex-col items-center">
        
        {/* 文件选择区域 */}
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">文件选择</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* 拖拽区域 */}
            <div
              ref={dragRef}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 drag-over-active' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className={`text-6xl transition-transform duration-300 ${
                  dragOver ? 'scale-110' : 'scale-100'
                }`}>
                  📁
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
                    {dragOver ? '放开文件以添加' : '拖拽XM文件或文件夹到这里'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    支持单个文件、多个文件或包含XM文件的文件夹
                  </p>
                </div>
                {dragOver && (
                  <div className="absolute inset-0 bg-blue-500/10 rounded-xl border-2 border-blue-500 animate-pulse"></div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2 justify-center">
              <ButtonGroup variant="flat">
                <Button 
                  color="primary" 
                  startContent={<span>📂</span>}
                  onPress={handleSelectFiles} 
                  disabled={isDecrypting}
                >
                  选择文件
                </Button>
                <Button 
                  color="primary" 
                  startContent={<span>📁</span>}
                  onPress={handleSelectFolder} 
                  disabled={isDecrypting}
                >
                  选择文件夹
                </Button>
                <Button 
                  color="secondary" 
                  startContent={<span>📁</span>}
                  onPress={handleSelectOutputDir} 
                  disabled={isDecrypting}
                >
                  选择输出目录
                </Button>
              </ButtonGroup>
              
              {selectedFiles.length > 0 && (
                <Button 
                  color="danger" 
                  variant="light"
                  startContent={<span>🗑️</span>}
                  onPress={clearAll} 
                  disabled={isDecrypting}
                >
                  清空
                </Button>
              )}
            </div>

            {/* 输出目录显示 */}
            {outputDir && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">输出目录: </span>
                  <span className="text-sm font-mono text-gray-800 dark:text-gray-200">{outputDir}</span>
                </div>
                <Button
                  size="sm"
                  color="primary"
                  variant="light"
                  onPress={handleOpenOutputFolder}
                  title="打开输出目录"
                >
                  📁
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 待处理文件列表 */}
        {selectedFiles.length > 0 && (
          <Card className="w-full max-w-3xl">
            <CardHeader className="flex justify-center items-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  待处理文件
                </h2>
                <Badge content={selectedFiles.length} color="primary" size="lg">
                  <Chip color="primary" variant="flat" className="text-lg px-3">
                    {selectedFiles.length} 个文件
                  </Chip>
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              <VirtualizedList
                items={selectedFiles}
                allItems={selectedFiles}
                maxHeight={800}
                onRemoveItem={removeFile}
                disabled={isDecrypting}
                emptyMessage="暂无文件"
              />
            </CardBody>
            <CardFooter>
              <div className="flex gap-2 w-full justify-center">
                <Button
                  size="lg"
                  color="success"
                  variant="shadow"
                  className="flex-1 max-w-xs"
                  startContent={<span>{isDecrypting ? '🔄' : '🔓'}</span>}
                  onPress={handleDecrypt}
                  disabled={isDecrypting || selectedFiles.length === 0}
                  isLoading={isDecrypting}
                >
                  {isDecrypting ? '解密中...' : '开始解密'}
                </Button>
                <Button
                  size="lg"
                  color="danger"
                  variant="light"
                  onPress={clearAll}
                  disabled={isDecrypting}
                >
                  清空
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* 解密结果 */}
        {results.length > 0 && (
          <Card className="w-full max-w-3xl mb-20">
            <CardHeader className="flex justify-center items-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  解密结果
                </h2>
                <div className="flex gap-2 justify-center">
                  <Chip color="success" variant="flat">
                    成功: {results.filter(r => r.success).length}
                  </Chip>
                  <Chip color="danger" variant="flat">
                    失败: {results.filter(r => !r.success).length}
                  </Chip>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <ResultsList
                results={results}
                maxHeight={800}
                emptyMessage="暂无结果"
              />
            </CardBody>
          </Card>
        )}
      </div>

      {/* 固定底部进度条 */}
      {isDecrypting && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  正在处理
                </span>
              </div>
              <Chip color="primary" variant="flat" size="sm">
                {progress.processed} / {progress.total}
              </Chip>
            </div>
            
            {progress.filename && (
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                <span className="font-medium">当前文件:</span> {progress.filename}
              </div>
            )}
            
            <Progress
              value={progressPercentage}
              maxValue={100}
              color="primary"
              className="w-full"
              size="md"
              showValueLabel={true}
              formatOptions={{
                style: 'percent',
                maximumFractionDigits: 1
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
