import React from 'react'
import { Button, Chip, Listbox, ListboxItem } from '@heroui/react'

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

interface ResultsListProps {
  results: DecryptionResult[]
  maxHeight?: number
  emptyMessage?: string
}

export const ResultsList: React.FC<ResultsListProps> = ({
  results,
  maxHeight = 320,
  emptyMessage = "暂无结果"
}) => {
  const displayResults = results

  const handleShowInFolder = async (filePath: string) => {
    try {
      await window.api.showItemInFolder(filePath)
    } catch (error) {
      console.error('Error opening folder:', error)
    }
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Listbox
        variant="flat"
        selectionMode="none"
        aria-label="解密结果列表"
        className="max-w-none"
        isVirtualized={displayResults.length > 50}
        virtualization={{
          maxListboxHeight: maxHeight,
          itemHeight: 150,
        }}
      >
        {displayResults.map((result, index) => (
          <ListboxItem
            key={index}
            className="py-3"
            startContent={
              <div className="flex-shrink-0">
                <span className="text-lg">
                  {result.success ? '✅' : '❌'}
                </span>
              </div>
            }
            endContent={
              <div className="flex gap-2 items-center">
                {result.success && result.outputPath && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    onPress={() => handleShowInFolder(result.outputPath!)}
                    title="在文件夹中显示"
                  >
                    📁
                  </Button>
                )}
                <Chip
                  size="sm"
                  color={result.success ? 'success' : 'danger'}
                  variant="flat"
                >
                  {result.success ? '成功' : '失败'}
                </Chip>
              </div>
            }
          >
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <span className={`font-medium truncate ${
                  result.success 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {result.filename}
                </span>
              </div>
              
              {result.error && (
                <p className="text-xs text-red-500 dark:text-red-400 mb-1">
                  错误: {result.error}
                </p>
              )}
              
              {result.success && result.outputPath && (
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                  输出: {result.outputPath}
                </p>
              )}
              
              {result.metadata && (
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  {result.metadata.title && (
                    <div>标题: {result.metadata.title}</div>
                  )}
                  {result.metadata.artist && (
                    <div>艺术家: {result.metadata.artist}</div>
                  )}
                  {result.metadata.album && (
                    <div>专辑: {result.metadata.album}</div>
                  )}
                  {result.metadata.format && (
                    <div>格式: {result.metadata.format}</div>
                  )}
                  {result.metadata.size && (
                    <div>大小: {(result.metadata.size / 1024 / 1024).toFixed(2)} MB</div>
                  )}
                </div>
              )}
            </div>
          </ListboxItem>
        ))}
      </Listbox>
      
      {/* 为底部进度条预留空间 */}
      <div className="h-16"></div>
    </div>
  )
}

export default ResultsList