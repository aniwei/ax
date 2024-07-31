import { Cursor } from './Cusor'

export abstract class Reader {
  protected cursor: Cursor
  protected decoder: TextDecoder

  public get eof (): boolean {
    return this.cursor.eof
  }

  public get byteLength (): number {
    return this.cursor.byteLength
  }

  constructor (bytes: ArrayBuffer) {
    this.cursor = new Cursor(bytes)
    this.decoder = new TextDecoder('utf-8')
  }

  protected readExact (size: number): Uint8Array {
    return this.cursor.readExact(size)
  }

  protected readByte (): number {
    return this.cursor.readExact(1)[0]
  }

  protected readBytes (size: number): Uint8Array {
    return this.cursor.readExact(size)
  }

  protected readUint32LE (): number {
    const bytes = this.cursor.readExact(4)

    if (bytes.length !== 4) {
      throw new Error("Failed to read 4 bytes for u32 conversion.")
    }

    return new DataView(bytes.buffer).getUint32(0, true)
  }

  protected readUnsignedLEB128 (): number {
    let value: number = 0
    let shift: number = 0
    let byte: number

    do {
      // Read a byte
      byte = this.readByte()
      // Mask the byte to get the 7 bits of data
      value |= (byte & 0x7F) << shift
      shift += 7
    } while (byte & 0x80)

    return value
  }

  protected readSignedLEB128 (): number {
    let result = 0
    let shift = 0
    let byte

    do {
      // Read a byte
      byte = this.readByte()
      // Mask the byte to get the 7 bits of data
      result |= (byte & 0x7F) << shift
      shift += 7
    } while (byte & 0x80)

    // 检查符号位，进行符号扩展
    if (shift < 64 && (byte & 0x40)) {
      result |= ~0 << shift
    }

    return result
  }

  protected readUint32 (): number {
    const value = this.readUnsignedLEB128()

    if (value < 0 || value > 0xFFFFFFFF) {
      throw new Error("Value out of range for u32");
    }

    return value
  }

  protected readInt64 (): number {
    const value = this.readSignedLEB128()
    return value
  }

  protected readInt32 (): number {
    const value = this.readSignedLEB128()
    return value
  }

  protected readFloat64 (): number {
    const view = new DataView(this.readExact(8).buffer)
    return view.getFloat64(0, true)  
  }

  protected readFloat32 (): number {
    const view = new DataView(this.readExact(4).buffer)
    return view.getFloat32(0, true)  
  }
}