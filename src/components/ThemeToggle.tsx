import React, { useState, useEffect } from 'react'
import { Button } from '@heroui/react'

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 检查系统偏好或本地存储
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDark(shouldUseDark)
    
    if (shouldUseDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <Button
      isIconOnly
      size="sm"
      variant="light"
      onPress={toggleTheme}
      className="text-gray-600 dark:text-gray-300"
    >
      {isDark ? '🌙' : '☀️'}
    </Button>
  )
}
