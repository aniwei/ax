import { Instruction, OpcodeId } from './Instructions'
import { Reader } from './Reader'
import { Block, BlockId, FunctionBody } from './Types'



export class CreateFunction extends Reader {
  static tryCreate  (payload: ArrayBuffer): FunctionBody {
    const func = new CreateFunction(payload)
    return func.create()
  }

  protected readBlock (): Block {
    const byte = this.readByte()
    const block: Block = {
      id: byte === 0x40 ? BlockId.Empty : BlockId.Value
    }

    if (block.id !== BlockId.Empty) {
      block.value = [byte]
    }

    return block
  }

  protected readInstruction (): Instruction {
    const op = this.readByte()
    const instruction: Instruction = {
      id: op
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
          type: this.readUint32(), 
          table: this.readUint32()
        }
        break
      case OpcodeId.I64Const: 
      case OpcodeId.F32Const:
        instruction.payload = this.readFloat32()
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

  public create(): FunctionBody {
    const func: FunctionBody = {
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

    while (!this.eof) {
      const instruction = this.readInstruction()
      func.code.push(instruction)
    }

    return func
  }
}
