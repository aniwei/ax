import { Instruction, OpcodeId } from './Instructions'
import { Reader } from './Reader'
import { BlockType, BlockTypeId, Export, FuncBody, FuncLocal, FuncType, Limits, Memory, Table } from './Types'

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

export class CreateFunction extends Reader {
  static tryCreate  (payload: ArrayBuffer): FuncBody {
    const func = new CreateFunction(payload)
    return func.create()
  }

  protected readBlock (): Block {
    const byte = this.readByte()
    const blockId = byte === 0x40 ? BlockTypeId.Empty : BlockTypeId.Value

    const block: Block = {
      id: blockId
    }

    if (blockId === BlockTypeId.Value) {
      block.value = [byte]
    }

    return block
  }

  protected readInstruction (): Instruction {
    const op = this.readByte()
    const instruction: Instruction = {
      id: this.readByte()
    }

    switch (op) {
      case OpcodeId.Block: 
      case OpcodeId.Loop:
      case OpcodeId.If:
        instruction.payload = this.readBlock()
        break
      case OpcodeId.Br: 
      case OpcodeId.BrIf:
      case OpcodeId.Call:
      case OpcodeId.LocalGet:
      case OpcodeId.LocalSet: 
      case OpcodeId.GlobalGet:
      case OpcodeId.GlobalSet:
      case OpcodeId.I32Const:
        instruction.payload = this.readUint32()
        break
      case OpcodeId.BrTable: 
        const count = this.readUint32()
        const indexes = []

        for (let i = 0; i < count; i++) {
          indexes.push(this.readUint32())
        }

        const defaultIndex = this.readUint32()
        instruction.payload = { indexes, defaultIndex }

        break
      case OpcodeId.CallIndirect: 
     
        instruction.payload = { 
          typeIndex: this.readUint32(), 
          tableIndex: this.readUint32()
        }
        break
      case OpcodeId.I64Const: 
      case OpcodeId.F32Const:
        instruction.payload = this.readUint64()
        break
      case OpcodeId.F64Const: 
        instruction.payload = this.readFloat64()
        break
      case OpcodeId.I32Load:
      case OpcodeId.I64Load:
      case OpcodeId.F32Load:
      case OpcodeId.F64Load:
      case OpcodeId.I32Load8S:
      case OpcodeId.I32Load8U:
      case OpcodeId.I32Load16S:
      case OpcodeId.I32Load16U:
      case OpcodeId.I64Load8S:
      case OpcodeId.I64Load8U:
      case OpcodeId.I64Load16S:
      case OpcodeId.I64Load16U:
      case OpcodeId.I64Load32S:
      case OpcodeId.I64Load32U:
      case OpcodeId.I32Store:
      case OpcodeId.I64Store:
      case OpcodeId.F32Store:
      case OpcodeId.F64Store:
      case OpcodeId.I32Store8:
      case OpcodeId.I32Store16:
      case OpcodeId.I64Store8:
      case OpcodeId.I64Store16:
      case OpcodeId.I64Store32:
      case OpcodeId.MemoryGrow:
        const memoryArg = {
          align: this.readUint32(),
          offset: this.readUint32()
        }
        instruction.payload = memoryArg
        break
      case OpcodeId.MemorySize:
        this.readByte()
        break
      
      case OpcodeId.MmeoryCopyOrFill: 
        const kind = this.readByte()

        switch (kind) {
          case 0x0A:
            const srcMemidx = this.readUint32()
            const destMemidx = this.readUint32()
            instruction.payload = { srcMemidx, destMemidx }
            break
          case 0x0B:
            const memidx = this.readUint32()
            instruction.payload = memidx
            break
          default:
            throw new Error('Invalid memory copy or fill kind')
        }
        break
    }

    return instruction
  }

  public create(): FuncBody {
    const func: FuncBody = {
      locals: [],
      code: []
    }

    const count = this.readUint32()

    for (let i = 0; i < count; i++) {
      const count = this.readUint32()
      const value = this.readByte()
      func.locals.push({ 
        count, 
        value 
      })
    }

    while (this.eof) {
      const instruction = this.readInstruction()
      func.code.push(instruction)
    }

    return func
  }
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

  protected readCodeSection (): FuncBody[] {
    const count = this.readUint32()
    const bodies: FuncBody[] = []

    for (let i = 0; i < count; i++) {
      const size = this.readUint32()
      const bytes = this.readBytes(size)

      const func = CreateFunction.tryCreate(bytes)
      bodies.push(func)
    }

    return bodies
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

      case SectionId.Code:
        section = new CodeSection(this.readCodeSection()) as Section<T>
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

export class CodeSection extends Section<FuncBody[]> {
  constructor (payload: FuncBody[]) {
    super(SectionId.Code, payload)
  }
}