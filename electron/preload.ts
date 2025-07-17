import { contextBridge, ipcRenderer, IpcRendererEvent, webUtils } from 'electron'

export const api = {
  // 窗口控制
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  
  // 文件和文件夹选择
  selectFiles: () => ipcRenderer.invoke('dialog:selectFiles'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  selectFolderForFiles: () => ipcRenderer.invoke('dialog:selectFolderForFiles'),
  selectOutputDirectory: () => ipcRenderer.invoke('dialog:selectOutputDirectory'),
  
  // 文件夹扫描
  scanFolder: (folderPath: string) => ipcRenderer.invoke('files:scanFolder', folderPath),
  
  // 文件路径获取 (使用 webUtils.getPathForFile)
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  
  // 系统操作
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  
  // 解密功能
  decryptFiles: (filePaths: string[], outputDir?: string) => ipcRenderer.invoke('decrypt:files', filePaths, outputDir),
  
  // 事件监听
  onDecryptProgress: (callback: (event: IpcRendererEvent, progress: any) => void) => {
    ipcRenderer.on('decrypt:progress', callback)
    return () => {
      ipcRenderer.removeListener('decrypt:progress', callback)
    }
  },
  onDecryptResult: (callback: (event: IpcRendererEvent, result: any) => void) => {
    ipcRenderer.on('decrypt:result', callback)
    return () => {
      ipcRenderer.removeListener('decrypt:result', callback)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

// 类型定义
declare global {
  interface Window {
    api: {
      // 窗口控制
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
      
      // 文件和文件夹选择
      selectFiles: () => Promise<string[]>
      selectDirectory: () => Promise<string>
      selectFolderForFiles: () => Promise<string[]>
      selectOutputDirectory: () => Promise<string>
      
      // 文件夹扫描
      scanFolder: (folderPath: string) => Promise<string[]>
      
      // 文件路径获取
      getPathForFile: (file: File) => string
      
      // 系统操作
      showItemInFolder: (filePath: string) => Promise<boolean>
      
      // 解密功能
      decryptFiles: (filePaths: string[], outputDir?: string) => Promise<void>
      
      // 事件监听
      onDecryptProgress: (callback: (event: IpcRendererEvent, progress: any) => void) => () => void
      onDecryptResult: (callback: (event: IpcRendererEvent, result: any) => void) => () => void
    }
  }
}
