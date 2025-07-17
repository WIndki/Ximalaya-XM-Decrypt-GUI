import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileTypeFromBuffer } from 'file-type'
import NodeID3 from 'node-id3'
import { parseBuffer } from 'music-metadata'
import { isMainThread } from 'worker_threads'

export interface XMInfo {
  title: string
  artist: string
  album: string
  trackNumber: number
  size: number
  headerSize: number
  ISRC: string
  encodedBy: string
  encodingTechnology: string
  
  /**
   * 生成解密用的初始化向量(IV)
   * 根据Python版本的逻辑：优先使用ISRC，否则使用encodedBy
   */
  iv(): Buffer
}

export interface DecryptionResult {
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

/**
 * XM音频文件信息类
 * 完全对应Python版本的XMInfo类
 */
export class XMInfo {
  public title: string = ''
  public artist: string = ''
  public album: string = ''
  public trackNumber: number = 0
  public size: number = 0
  public headerSize: number = 0
  public ISRC: string = ''
  public encodedBy: string = ''
  public encodingTechnology: string = ''

  /**
   * 生成解密用的初始化向量(IV)
   * 根据Python版本的逻辑：优先使用ISRC，否则使用encodedBy
   */
  iv(): Buffer {
    if (this.ISRC !== '') {
      return Buffer.from(this.ISRC, 'hex')
    }
    return Buffer.from(this.encodedBy, 'hex')
  }
}

/**
 * 喜马拉雅XM音频解密服务
 * 完全实现Python版本main.py的所有解密功能
 */
export class DecryptionService {
  private readonly XM_KEY = Buffer.from('ximalayaximalayaximalayaximalaya', 'utf-8') // 32字节AES-256密钥
  private readonly WASM_MODULE_PATH: string;
  private wasmInstance: any = null
  private wasmInitPromise: Promise<void> | null = null;

  constructor() {
    console.log('DecryptionService initialized')
    
    let wasmPath: string;
    // 在工作线程中，app 对象不可用，需要调整路径逻辑
    if (isMainThread) {
      const app = require('electron').app
      const isDev = !app.isPackaged;
      if (isDev) {
        // 开发环境：从项目根目录的 electron/services 加载
        wasmPath = path.join(app.getAppPath(), 'electron', 'services', 'xm_encryptor.wasm');
      } else {
        // 生产环境（打包后）：从asar外部的resources目录加载
        wasmPath = path.join(process.resourcesPath, 'xm_encryptor.wasm');
      }
    } else {
      // 在工作线程中，路径需要相对于工作目录
      // 假设工作线程的启动脚本和WASM文件在同一目录
      wasmPath = path.join(__dirname, 'xm_encryptor.wasm');
    }
    
    this.WASM_MODULE_PATH = wasmPath;
    console.log(`WASM module path: ${this.WASM_MODULE_PATH}`)
    this.wasmInitPromise = this.initializeWASMModule()
  }

  private async ensureWASMInitialized(): Promise<void> {
    if (this.wasmInitPromise) {
      await this.wasmInitPromise;
    }
  }

  /**
   * 初始化WASM模块
   */
  private async initializeWASMModule(): Promise<void> {
    try {
      if (fs.existsSync(this.WASM_MODULE_PATH)) {
        const wasmBytes = fs.readFileSync(this.WASM_MODULE_PATH)
        console.log(`加载WASM模块: ${this.WASM_MODULE_PATH} (${wasmBytes.length} bytes)`)
        
        // 对应Python wasmer的Store, Module, Instance
        // Node.js中直接使用WebAssembly API
        const importObject = {
          env: {
            memory: new (global as any).WebAssembly.Memory({ initial: 256 }),
            __memory_base: 0,
            __table_base: 0,
            // 如果WASM需要其他导入函数，需要在这里提供
          }
        };

        const wasmModule = await (global as any).WebAssembly.compile(wasmBytes)
        this.wasmInstance = await (global as any).WebAssembly.instantiate(wasmModule, importObject)
        
        // 检查导出的函数
        const exports = this.wasmInstance.exports
        console.log('WASM导出函数:', Object.keys(exports))
        
        // 检查内存
        const memory = exports.memory || exports.i
        if (memory && memory.buffer) {
          console.log(`WASM内存大小: ${memory.buffer.byteLength} bytes`)
        } else {
          console.warn('WASM模块没有导出内存')
        }
        
        console.log('WASM module loaded successfully')
      } else {
        console.warn('WASM module not found at:', this.WASM_MODULE_PATH)
        throw new Error(`WASM module not found at: ${this.WASM_MODULE_PATH}`);
      }
    } catch (error) {
      console.error('Failed to load WASM module:', error)
      throw error;
    }
  }

  /**
   * 解密单个XM文件
   * 完全对应Python版本的decrypt_xm_file函数
   */
  async decryptFile(
    inputPath: string, 
    originalFilename: string, 
    outputDir: string
  ): Promise<DecryptionResult> {
    try {
      console.log(`正在解密${originalFilename}`)

      await this.ensureWASMInitialized();

      // 读取文件数据
      const fileBuffer = this.readFile(inputPath)
      
      if (fileBuffer.length < 1024) {
        throw new Error('File too small to be a valid .xm file')
      }

      // 执行XM解密流程
      const { xmInfo, audioData } = await this.xmDecrypt(fileBuffer)
      
      // 识别音频格式
      const audioFormat = await this.findAudioExtension(audioData.slice(0, 0xFF))
      
      // 生成输出路径
      const albumDir = this.replaceInvalidChars(xmInfo.album)
      const fullOutputDir = path.join(outputDir, albumDir)
      
      if (!fs.existsSync(fullOutputDir)) {
        fs.mkdirSync(fullOutputDir, { recursive: true })
      }
      
      // 统一文件名格式：音轨号 - 标题.后缀
      const safeTitle = this.replaceInvalidChars(xmInfo.title)
      const outputFilename = `${safeTitle}.${audioFormat}`
      const outputPath = path.join(fullOutputDir, outputFilename)
      
      // 为音频数据添加元数据标签
      const taggedAudioData = await this.addAudioTags(audioData, xmInfo, audioFormat)
      
      // 保存解密后的文件
      fs.writeFileSync(outputPath, taggedAudioData)
      
      console.log(`解密成功，文件保存至${outputPath}！`)
      
      return {
        filename: originalFilename,
        success: true,
        outputPath,
        metadata: {
          title: xmInfo.title,
          artist: xmInfo.artist,
          album: xmInfo.album,
          trackNumber: xmInfo.trackNumber,
          format: audioFormat,
          size: taggedAudioData.length
        }
      }
    } catch (error) {
      console.error(`Error decrypting ${originalFilename}:`, error)
      return {
        filename: originalFilename,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 读取文件
   * 对应Python版本的read_file函数
   */
  private readFile(filePath: string): Buffer {
    return fs.readFileSync(filePath)
  }

  /**
   * XM解密主函数
   * 完全对应Python版本的xm_decrypt函数
   */
  private async xmDecrypt(rawData: Buffer): Promise<{ xmInfo: XMInfo, audioData: Buffer }> {
    // 解析ID3头部信息
    const xmInfo = this.getXMInfo(rawData)
    console.log('ID3 header size:', `0x${xmInfo.headerSize.toString(16)}`)
    
    // 提取加密数据段
    const encryptedData = rawData.slice(
      xmInfo.headerSize, 
      xmInfo.headerSize + xmInfo.size
    )

    // 第一阶段：AES-256-CBC解密
    const iv = xmInfo.iv()
    console.log(`解密第一阶段 (AES-256-CBC):`)
    console.log(`    数据长度 = ${encryptedData.length}`)
    console.log(`    密钥 = ${this.XM_KEY.toString()}`)
    console.log(`    IV = ${iv.toString('hex')} (长度: ${iv.length})`)
    console.log(`    ISRC = "${xmInfo.ISRC}"`)
    console.log(`    encodedBy = "${xmInfo.encodedBy}"`)
    
    if (iv.length !== 16) {
      throw new Error(`Invalid IV length: ${iv.length}, expected 16`)
    }
    
    const cipher = crypto.createDecipheriv('aes-256-cbc', this.XM_KEY, iv)
    cipher.setAutoPadding(false)
    
    // 对应 python: de_data = cipher.decrypt(pad(encrypted_data, 16))
    // 这是一个非常规操作，但我们必须遵循
    const paddedData = this.padToPKCS7(encryptedData, 16)
    const deData = Buffer.concat([cipher.update(paddedData), cipher.final()])
    console.log('第一阶段解密成功')

    // 第二阶段：WASM模块解密
    const printableData = this.getPrintableBytes(deData)
    const trackId = Buffer.from(xmInfo.trackNumber.toString(), 'utf-8')
    
    console.log(`解密第二阶段 (xmDecrypt):`)
    console.log(`    数据长度 = ${printableData.length}`)
    console.log(`    轨道ID = ${trackId.toString()}`)
    
    const wasmResult = await this.performWASMDecryption(printableData, trackId)
    console.log('第二阶段解密成功')

    // 第三阶段：数据合并
    console.log('第三阶段 (base64解码和数据合并)')
    const fullBase64 = xmInfo.encodingTechnology + wasmResult
    const decryptedData = Buffer.from(fullBase64, 'base64')
    
    // 合并解密数据和原文件剩余部分
    const remainingData = rawData.slice(xmInfo.headerSize + xmInfo.size)
    const finalData = Buffer.concat([decryptedData, remainingData])
    console.log('第三阶段合并成功')

    return { xmInfo, audioData: finalData }
  }

  /**
   * 获取XM文件信息
   * 完全对应Python版本的get_xm_info函数
   */
  private getXMInfo(data: Buffer): XMInfo {
    const xmInfo = new XMInfo()
    
    // 验证ID3头部
    if (data.length < 10 || data.toString('ascii', 0, 3) !== 'ID3') {
      throw new Error('Invalid ID3 header')
    }
    
    // 读取ID3头部大小
    const id3Size = ((data[6] & 0x7f) << 21) |
                    ((data[7] & 0x7f) << 14) |
                    ((data[8] & 0x7f) << 7) |
                    (data[9] & 0x7f)
    
    xmInfo.headerSize = id3Size + 10
    
    // 解析ID3帧
    let offset = 10
    const id3End = 10 + id3Size
    
    while (offset < id3End - 10) {
      const frameId = data.toString('ascii', offset, offset + 4)
      const frameSize = data.readUInt32BE(offset + 4)
      
      if (frameSize === 0 || frameSize > (id3End - offset - 10)) {
        break
      }
      
      const frameData = data.slice(offset + 10, offset + 10 + frameSize)
      const frameText = this.parseID3TextFrame(frameData)
      
      switch (frameId) {
        case 'TIT2':
          xmInfo.title = frameText
          break
        case 'TPE1':
          xmInfo.artist = frameText
          break
        case 'TALB':
          xmInfo.album = frameText
          break
        case 'TRCK':
          xmInfo.trackNumber = parseInt(frameText) || 0
          break
        case 'TSRC':
          xmInfo.ISRC = frameText
          break
        case 'TENC':
          xmInfo.encodedBy = frameText
          break
        case 'TSIZ':
          xmInfo.size = parseInt(frameText) || 0
          break
        case 'TSSE':
          xmInfo.encodingTechnology = frameText
          break
      }
      
      offset += 10 + frameSize
    }
    
    console.log(`ID3解析完成: title="${xmInfo.title}", artist="${xmInfo.artist}", album="${xmInfo.album}", trackNumber=${xmInfo.trackNumber}, ISRC="${xmInfo.ISRC}", encodedBy="${xmInfo.encodedBy}", size=${xmInfo.size}, encodingTechnology="${xmInfo.encodingTechnology}"`)
    
    if (xmInfo.size === 0) {
      throw new Error('TSIZ字段未找到或值为0，无法确定加密数据大小')
    }
    
    return xmInfo
  }

  /**
   * 解析ID3文本帧
   */
  private parseID3TextFrame(frameData: Buffer): string {
    if (frameData.length < 1) return ''
    
    const encoding = frameData[0]
    let textData = frameData.slice(1)
    
    let result: string;
    switch (encoding) {
      case 0: // ISO-8859-1
        const nullIndexLatin1 = textData.indexOf(0x00)
        if (nullIndexLatin1 !== -1) {
          textData = textData.slice(0, nullIndexLatin1)
        }
        result = textData.toString('latin1')
        break
      case 1: // UTF-16 with BOM
        // BOM (FF FE or FE FF) is handled by toString('utf16le')
        let termIndex = -1;
        for (let i = 0; i < textData.length - 1; i += 2) {
            if (textData[i] === 0x00 && textData[i+1] === 0x00) {
                termIndex = i;
                break;
            }
        }
        if (termIndex !== -1) {
            textData = textData.slice(0, termIndex);
        }
        result = textData.toString('utf16le')
        break
      case 2: // UTF-16BE without BOM
        let termIndexBE = -1;
        for (let i = 0; i < textData.length - 1; i += 2) {
            if (textData[i] === 0x00 && textData[i+1] === 0x00) {
                termIndexBE = i;
                break;
            }
        }
        if (termIndexBE !== -1) {
            textData = textData.slice(0, termIndexBE);
        }
        result = textData.toString('utf16le') // Node.js doesn't have utf16be, but utf16le can often handle it if BOM is absent
        break
      case 3: // UTF-8
        const nullIndexUTF8 = textData.indexOf(0x00)
        if (nullIndexUTF8 !== -1) {
          textData = textData.slice(0, nullIndexUTF8)
        }
        result = textData.toString('utf8')
        break
      default:
        // Fallback for unknown encodings
        const nullIndexDefault = textData.indexOf(0x00)
        if (nullIndexDefault !== -1) {
          textData = textData.slice(0, nullIndexDefault)
        }
        result = textData.toString('latin1') // Safest fallback
        break
    }
    return result.trim()
  }

  /**
   * PKCS7填充 (对应 Python's pad)
   */
  private padToPKCS7(data: Buffer, blockSize: number): Buffer {
    const paddingLength = blockSize - (data.length % blockSize)
    const padding = Buffer.alloc(paddingLength, paddingLength)
    return Buffer.concat([data, padding])
  }

  /**
   * 获取可打印字节数量
   * 对应Python版本的get_printable_count函数
   */
  private getPrintableCount(data: Buffer): number {
    for (let i = 0; i < data.length; i++) {
      const byte = data[i]
      if (byte < 0x20 || byte > 0x7e) {
        return i
      }
    }
    return data.length
  }

  /**
   * 获取可打印字节部分
   * 对应Python版本的get_printable_bytes函数
   */
  private getPrintableBytes(data: Buffer): Buffer {
    const count = this.getPrintableCount(data)
    return data.slice(0, count)
  }

  /**
   * 执行WASM模块解密
   * 完全对应Python版本的WASM调用逻辑
   */
  private async performWASMDecryption(printableData: Buffer, trackId: Buffer): Promise<string> {
    await this.ensureWASMInitialized();
    if (!this.wasmInstance) {
      throw new Error('WASM模块未初始化')
    }

    try {
      const exports = this.wasmInstance.exports
      
      // 获取栈指针
      const stackPointer = exports.a(-16)
      
      // 分配内存
      const deDataOffset = exports.c(printableData.length)
      const trackIdOffset = exports.c(trackId.length)
      
      // 获取内存视图
      const memory = exports.memory || exports.i
      const memoryView = new Uint8Array(memory.buffer)
      
      // 复制数据到WASM内存
      for (let i = 0; i < printableData.length; i++) {
        memoryView[deDataOffset + i] = printableData[i]
      }
      
      for (let i = 0; i < trackId.length; i++) {
        memoryView[trackIdOffset + i] = trackId[i]
      }
      
      // 调用WASM函数
      exports.g(stackPointer, deDataOffset, printableData.length, trackIdOffset, trackId.length)
      
      // 读取结果
      const memoryInt32 = new Int32Array(memory.buffer, stackPointer, 4)
      const resultPointer = memoryInt32[0]
      const resultLength = memoryInt32[1]
      
      // 检查结果有效性
      if (memoryInt32[2] !== 0 || memoryInt32[3] !== 0) {
        throw new Error('WASM解密失败')
      }
      
      // 提取结果字符串
      const resultBuffer = new Uint8Array(memory.buffer, resultPointer, resultLength)
      return Buffer.from(resultBuffer).toString('utf8')
      
    } catch (error) {
      console.error('WASM解密失败:', error)
      throw new Error('WASM解密过程中发生错误')
    }
  }

  /**
   * 识别音频格式
   * 对应Python版本的find_ext函数
   */
  private async findAudioExtension(data: Buffer): Promise<string> {
    const formats = ['m4a', 'mp3', 'flac', 'wav']
    
    try {
      // 使用file-type库通过magic number检测，这是magic库的最佳替代
      const fileTypeResult = await fileTypeFromBuffer(data)
      
      if (fileTypeResult && formats.includes(fileTypeResult.ext)) {
        console.log(`音频格式检测 (file-type): ${fileTypeResult.ext}`)
        return fileTypeResult.ext
      }
      
      // 备用方案：如果file-type无法识别，则根据已知音频格式的特征进行猜测
      console.warn('file-type无法识别格式，尝试备用方案...')
      const header = data.slice(0, 16).toString('ascii')
      if (header.includes('ftyp')) return 'm4a'
      if (header.includes('fLaC')) return 'flac'
      if (header.includes('RIFF') && header.includes('WAVE')) return 'wav'
      // MP3的magic number比较特殊 (FF FB or FF F3 or FF F2)
      if (data[0] === 0xFF && (data[1] & 0xE0) === 0xE0) return 'mp3'
      
      console.warn('无法可靠识别音频格式，默认为mp3')
      return 'mp3' // 默认值
      
    } catch (error) {
      console.error('音频格式检测失败:', error)
      return 'mp3' // 出错时返回默认值
    }
  }

  /**
   * 为音频数据添加元数据标签
   */
  private async addAudioTags(audioData: Buffer, xmInfo: XMInfo, format: string): Promise<Buffer> {
    try {
      // Python的mutagen支持多种格式，NodeID3主要用于MP3
      if (format === 'mp3') {
        const tags: NodeID3.Tags = {
          title: xmInfo.title,
          artist: xmInfo.artist,
          album: xmInfo.album,
          trackNumber: xmInfo.trackNumber.toString()
        }
        
        console.log('正在为MP3文件写入ID3标签:', tags)
        // NodeID3.write会创建一个带标签的新buffer
        return NodeID3.write(tags, audioData)
      }
      
      console.log(`格式为 ${format}, 跳过标签写入。`)
      return audioData
      
    } catch (error) {
      console.warn('写入音频标签失败:', error)
      return audioData // 返回原始数据
    }
  }

  /**
   * 替换文件名中的无效字符
   * 对应Python版本的replace_invalid_chars函数
   */
  private replaceInvalidChars(filename: string): string {
    // Python版本替换为" "
    return filename.replace(/[<>:"/\\|?*]/g, ' ')
  }

  /**
   * 检查服务状态
   */
  checkStatus(): { status: string; wasmLoaded: boolean } {
    return {
      status: 'running',
      wasmLoaded: this.wasmInstance !== null
    }
  }
}
