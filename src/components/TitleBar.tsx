import React, { useState, useEffect } from 'react'
import { Button } from '@heroui/react'
import { ThemeToggle } from './ThemeToggle'
import './TitleBar.css'

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.api) {
        const maximized = await window.api.windowIsMaximized()
        setIsMaximized(maximized)
      }
    }
    checkMaximized()
  }, [])

  const handleMinimize = () => {
    if (window.api) {
      window.api.windowMinimize()
    }
  }

  const handleMaximize = async () => {
    if (window.api) {
      await window.api.windowMaximize()
      const maximized = await window.api.windowIsMaximized()
      setIsMaximized(maximized)
    }
  }

  const handleClose = () => {
    if (window.api) {
      window.api.windowClose()
    }
  }

  return (
    <div className="flex items-center justify-between h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 select-none fixed top-0 left-0 w-full z-50" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-center space-x-2 px-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="w-4 h-4 flex-shrink-0">
          <img src="./icon.svg" alt="App Icon" className="w-full h-full" />
        </div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          喜马拉雅音频解密工具
        </div>
      </div>
      
      {/* <div className="flex-1 h-full" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} /> */}
      
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <ThemeToggle />
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="h-8 w-8 min-w-8 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700"
          onPress={handleMinimize}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 6h10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </Button>
        
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="h-8 w-8 min-w-8 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700"
          onPress={handleMaximize}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 2v8h8V2H2zM3 3h6v6H3V3z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M1 1v10h10V1H1zM2 2h8v8H2V2z" fill="currentColor" />
            </svg>
          )}
        </Button>
        
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="h-8 w-8 min-w-8 rounded-none hover:bg-red-500 hover:text-white"
          onPress={handleClose}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M1 11L11 1" stroke="currentColor" strokeWidth="1" />
          </svg>
        </Button>
      </div>
    </div>
  )
}

export default TitleBar
