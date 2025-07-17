import React from 'react'
import { Listbox, ListboxItem, Avatar, Button, ScrollShadow } from '@heroui/react'

interface VirtualizedListProps {
  items: string[]
  allItems: string[]
  maxHeight?: number
  onRemoveItem: (index: number) => void
  disabled?: boolean
  emptyMessage?: string
}

export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  allItems,
  maxHeight = 320,
  onRemoveItem,
  disabled = false,
  emptyMessage = "暂无数据"
}) => {
  const displayItems = items

  if (allItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    )
  }

  const handleRemoveItem = (displayIndex: number) => {
    const item = displayItems[displayIndex]
    const actualIndex = allItems.indexOf(item)
    onRemoveItem(actualIndex)
  }

  const handleShowInFolder = async (filePath: string) => {
    try {
      await window.api.showItemInFolder(filePath)
    } catch (error) {
      console.error('Error opening folder:', error)
    }
  }

  return (
    <div className="space-y-4">
      <Listbox
        variant="flat"
        selectionMode="none"
        aria-label="文件列表"
        className="max-w-none"
        isVirtualized={displayItems.length > 50}
        virtualization={{
          maxListboxHeight: maxHeight,
          itemHeight: 56, // 大约匹配 ListboxItem 的高度
        }}
        items={displayItems.map((item, index) => ({ key: index, item }))}
      >
        {displayItems.map((item, index) => (
          <ListboxItem
            key={index}
            className="py-3"
            startContent={
              <Avatar
                icon={<span className="text-lg">🎵</span>}
                className="w-8 h-8 bg-blue-100 dark:bg-blue-900"
              />
            }
            endContent={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  variant="light"
                  onPress={() => handleShowInFolder(item)}
                  disabled={disabled}
                  title="在文件夹中显示"
                >
                  📁
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleRemoveItem(index)}
                  disabled={disabled}
                >
                  删除
                </Button>
              </div>
            }
          >
            <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
              {item.split(/[\\/]/).pop()}
            </span>
          </ListboxItem>
        ))}
      </Listbox>
    </div>
  )
}

export default VirtualizedList
