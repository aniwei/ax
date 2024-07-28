import { Reader } from './Reader'
import { Export, FuncType, Limits, Memory, Table } from './Types'

export enum SectionId {
  Custom = 0x00,
  Type = 0x01,
  Import = 0x02,
  Function = 0x03,
  Table = 0x04,
  Memory = 0x05,
  Global = 0x06,
  Export = 0x07,
  Start = 0x08,
  Element = 0x09,
  Code = 0x0a,
  Data = 0x0b,
}

export class CreateSection extends Reader {
  static tryCreate <T> (id: number, payload: ArrayBuffer): Section<T> {
    const section = new CreateSection(payload)
    return section.create<T>(id)
  }

  protected readFuncSection (): number[] {
    const functionIndexes: number[] = []
    const count = this.readUint32()
    
    for (let i = 0; i < count; i++) {
      functionIndexes.push(this.readUint32())
    }

    return functionIndexes
  }

  protected readLimits (): Limits {
    const limits = this.readUint32()
    const min = this.readUint32()
    const max = limits === 0x00 ? null : this.readUint32()

    return { min, max }  
  }

  protected readMemory (): Memory {
    const limits = this.readLimits()
    return { limits }
  }

  protected readMemorySection (): Memory[] {
    const count = this.readUint32()
    const mems: Memory[] = []
    
    if (count !== 1) {
      throw new Error('Invalid count of memory, must be 1')
    }

    for (let i = 0; i < count; i++) {
      mems.push(this.readMemory())
    }

    return mems
  }

  protected readTable (): Table {
    const type = this.readByte()
    
    if (type !== 0x70) {
      throw new Error('Invalid elemment type of table, must be funcref')
    }

    const limits = this.readLimits();
    
    return {
      limits,
      type
    }
  }

  protected readTableSecttion (): Table[] {
    const count = this.readUint32()
    
    if (count !== 1) {
      throw new Error('Invalid count of table, must be 1')
    }

    const tables: Table[] = []

    for (let i = 0; i < count; i++) {
      tables.push(this.readTable())
    }
    
    return tables
  }

  protected readTypeSection (): FuncType[] {
    const types: FuncType[] = []
    const count = this.readUint32()
    
    for (let i = 0; i < count; i++) {
      const funcType = this.readByte()
      
      if (funcType !== 0x60) {
        throw new Error('Invalid func type')
      }

      const func: FuncType = {
        params: [],
        results: []
      }

      const paramsSize = this.readUint32()

      for (let j = 0; j < paramsSize; j++) {
        const valueType = this.readByte()
        func.params.push(valueType)
      }

      const resultsSize = this.readUint32()

      for (let j = 0; j < resultsSize; j++) {
        const valueType = this.readByte()
        func.results.push(valueType)
      }

      types.push(func)
    }

    return types
  }

  protected readExportSection (): Export[] {
    const count = this.readUint32()
    const exports: Export[] = []

    for (let i = 0; i < count; i++) {
      const nameLength = this.readUint32()
      const name = this.decoder.decode(this.readBytes(nameLength))
      const exportKind = this.readByte()
      const index = this.readUint32()

      exports.push({
        name,
        description: {
          id: exportKind,
          index
        }
      })
    }

    return exports  
  }

  public create <T>(id: number): Section<T> {
    let section: Section<T> | null = null

    switch (id) {
      case SectionId.Type:
        section = new TypeSection(this.readTypeSection()) as Section<T>
        break
      case SectionId.Function:
        section = new FuncSection(this.readFuncSection()) as Section<T>
        break

      case SectionId.Memory:
        section = new MemorySection(this.readMemorySection()) as Section<T>
        break

      case SectionId.Table:
        section = new TableSection(this.readTableSecttion()) as Section<T>
        break

      case SectionId.Export:
        section = new ExportSection(this.readExportSection()) as Section<T>
        break
    }

    if (section === null) {
      throw new Error('Invalid section id')
    }

    return section
  }
}


export abstract class Section<T> {
  static tryCreate <T> (id: number, payload: ArrayBuffer): Section<T> {
    const section = CreateSection.tryCreate<T>(id, payload)
    return section
  }

  public id: number
  protected payload: T

  constructor (id: number, payload: T) {
    this.id = id
    this.payload = payload
  }
}

export class TypeSection extends Section<FuncType[]> {
  constructor (payload: FuncType[]) {
    super(SectionId.Type, payload)
  }
}

export class MemorySection extends Section<Memory[]> {
  constructor (payload: Memory[]) {
    super(SectionId.Memory, payload)
  }
}

export class FuncSection extends Section<number[]> {
  constructor (payload: number[]) {
    super(SectionId.Function, payload)
  }
}

export class TableSection extends Section<Table[]> {
  constructor (payload: Table[]) {
    super(SectionId.Table, payload)
  }
}

export class ExportSection extends Section<Export[]> {
  constructor (payload: Export[]) {
    super(SectionId.Export, payload)
  }
}