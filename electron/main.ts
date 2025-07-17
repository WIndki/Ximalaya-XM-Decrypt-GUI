import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { DecryptionWorkerService } from './services/decryptionManager'
import { DecryptionResult } from './services/decryptionService'

const isDev = !app.isPackaged;

// 获取 icon 路径的函数
const getIconPath = (): string => {
  if (isDev) {
    return path.join(__dirname, '../public/icon.png')
  } else {
    return path.join(process.resourcesPath, 'icon.png')
  }
}

let mainWindow: BrowserWindow | null = null
let decryptionManager: DecryptionWorkerService

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: getIconPath(),
    show: false,
    frame: false, // 隐藏系统边框
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#1a1a2e',
    resizable: true,
    maximizable: true,
    fullscreenable: true,
  })

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', async () => {
    // 确保工作线程被清理
    if (decryptionManager) {
      await decryptionManager.cleanup()
    }
    mainWindow = null
  })
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow()
  
  decryptionManager = new DecryptionWorkerService()

  // 窗口控制
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('window:close', async () => {
    // 在关闭窗口前先清理工作线程
    if (decryptionManager) {
      await decryptionManager.cleanup()
    }
    mainWindow?.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() || false
  })

  // 文件和文件夹选择
  ipcMain.handle('dialog:selectFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Ximalaya Audio', extensions: ['xm'] }],
    })
    if (canceled) return []
    return filePaths
  })

  ipcMain.handle('dialog:selectDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (canceled) return null
    return filePaths[0]
  })

  // 选择文件夹并获取其中的.xm文件(深度1)
  ipcMain.handle('dialog:selectFolderForFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (canceled) return []
    
    const folderPath = filePaths[0]
    return scanXMFiles(folderPath)
  })
  
  // 扫描指定目录及其子目录中的.xm文件（深度1）
  const scanXMFiles = (folderPath: string): string[] => {
    const xmFiles: string[] = []
    
    try {
      const files = fs.readdirSync(folderPath)
      for (const file of files) {
        const filePath = path.join(folderPath, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isFile() && file.toLowerCase().endsWith('.xm')) {
          xmFiles.push(filePath)
        } else if (stat.isDirectory()) {
          // 扫描子目录（深度1）
          try {
            const subFiles = fs.readdirSync(filePath)
            for (const subFile of subFiles) {
              const subFilePath = path.join(filePath, subFile)
              const subStat = fs.statSync(subFilePath)
              if (subStat.isFile() && subFile.toLowerCase().endsWith('.xm')) {
                xmFiles.push(subFilePath)
              }
            }
          } catch (error) {
            console.error(`Error reading subfolder ${filePath}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error reading folder:', error)
    }
    
    return xmFiles
  }
  
  // 处理文件夹拖拽
  ipcMain.handle('files:scanFolder', async (event, folderPath: string) => {
    return scanXMFiles(folderPath)
  })
  
  ipcMain.handle('dialog:selectOutputDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (canceled) return null
    return filePaths[0]
  })

  // 打开文件夹
  ipcMain.handle('shell:showItemInFolder', async (event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return true
    } catch (error) {
      console.error('Error opening folder:', error)
      return false
    }
  })

  ipcMain.handle('decrypt:files', async (event, filePaths: string[], outputDir?: string) => {
    const defaultOutputDir = path.join(app.getPath('documents'), 'XimalayaDecrypt')
    
    try {
      // 设置事件监听器
      const progressListener = (progress: { processed: number, total: number, filename: string }) => {
        event.sender.send('decrypt:progress', progress)
      }
      
      const resultListener = (result: DecryptionResult) => {
        event.sender.send('decrypt:result', result)
      }
      
      const completeListener = () => {
        // 清理事件监听器
        decryptionManager.removeListener('progress', progressListener)
        decryptionManager.removeListener('result', resultListener)
        decryptionManager.removeListener('complete', completeListener)
        decryptionManager.removeListener('error', errorListener)
      }
      
      const errorListener = (error: Error) => {
        console.error('Decryption error:', error)
        // 清理事件监听器
        decryptionManager.removeListener('progress', progressListener)
        decryptionManager.removeListener('result', resultListener)
        decryptionManager.removeListener('complete', completeListener)
        decryptionManager.removeListener('error', errorListener)
      }
      
      // 注册事件监听器
      decryptionManager.on('progress', progressListener)
      decryptionManager.on('result', resultListener)
      decryptionManager.once('complete', completeListener)
      decryptionManager.once('error', errorListener)
      
      // 开始解密
      decryptionManager.decryptFiles(
        filePaths,
        outputDir || defaultOutputDir
      )
      
      return true
    } catch (error) {
      console.error('Decryption failed:', error)
      return false
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
  
  // 清理资源
  app.on('before-quit', async () => {
    await decryptionManager.cleanup()
  })
})

app.on('window-all-closed', async () => {
  await decryptionManager.cleanup()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
