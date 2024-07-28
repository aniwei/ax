import { Cursor } from './Cusor'

export abstract class Reader {
  protected cursor: Cursor
  protected decoder: TextDecoder

  public get eof (): boolean {
    return this.cursor.eof
  }

  constructor (bytes: ArrayBuffer) {
    this.cursor = new Cursor(bytes)
    this.decoder = new TextDecoder('utf-8')
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

  protected leb128ReadUnsigned (): number {
    let value: number = 0
    let shift: number = 0
    let byte: number

    do {
      byte = this.readByte()
      value |= (byte & 0x7F) << shift
      shift += 7
    } while (byte & 0x80)

    return value
  }

  protected readUint32 (): number {
    const value = this.leb128ReadUnsigned()

    if (value > Number.MAX_SAFE_INTEGER) {
      throw new Error("Value exceeds safe integer limit")
    }

    return value >>> 0
  }
}