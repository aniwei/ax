import { Reader } from './Reader'
import { ExportSection, FuncSection, MemorySection, Section, SectionId, TableSection, TypeSection } from './Section'
import type { WasmHeader } from './Types'

export class CreateModule extends Reader {
  static tryCreate (bytes: ArrayBuffer): Module {
    const module = new CreateModule(bytes)    
    return module.create()
  }

  protected readHeader (): WasmHeader {
    const magic = this.readMagic()
    const version = this.readVersion()

    return { 
      magic, 
      version 
    }
  }

  protected readVersion (): number {
    const version = this.readUint32LE()
    
    if (version !== 1) {
      throw new Error('Invalid binary version')
    }

    return version
  }

  protected readMagic (): string {
    // Read the magic number, which is 4 bytes long
    const bytes = this.cursor.readExact(4)
    try {
      // Convert bytes to string using TextDecoder
      const magic = this.decoder.decode(bytes)
      if (magic !== '\0asm') {
        throw new Error('Invalid binary magic')
      }

      return magic
    } catch (error: unknown) {
      throw new Error('Error occurred while decodding to string: ' + (error as Error).message)
    }
  }

  protected readSection<T> (): Section<T> {
    const id = this.readByte()
    const size = this.readUint32()
    const bytes = this.readBytes(size)
    
    return Section.tryCreate(id, bytes.buffer)
  }

  public create () {
    const { magic, version } = this.readHeader()
    const module = new Module(magic, version)

    while (!this.cursor.eof) {
      const section = this.readSection()

      switch (section.id) {
        case SectionId.Type:
          module.type = section as TypeSection
          break
        case SectionId.Function:
          module.func = section as FuncSection
          break

        case SectionId.Memory:
          module.memory = section as MemorySection
          break

        case SectionId.Table:
          module.table = section as TableSection
          break

        case SectionId.Export:
          module.export = section as ExportSection
          break
      }

    }

    return module
  }
}

export class Module {
  static tryCreate (bytes: ArrayBuffer): Module {
    return CreateModule.tryCreate(bytes)
  }

  protected magic: string
  protected version: number

  public type: TypeSection | null = null
  public func: FuncSection | null = null
  public memory: MemorySection | null = null
  public table: TableSection | null = null
  public export: ExportSection | null = null

  constructor (magic: string, version: number) {
    this.magic = magic
    this.version = version
  }
}