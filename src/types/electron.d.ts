declare global {
  interface Window {
    electronAPI?: {
      selectFiles: () => Promise<string[]>
      selectOutputDirectory: () => Promise<string>
      getAppVersion: () => Promise<string>
    }
  }
}

export {}
