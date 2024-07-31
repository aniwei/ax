export class Cursor {
  private position: number
  private data: Uint8Array

  public get eof (): boolean {
    return this.position >= this.data.byteLength
  }

  public get buffer(): Uint8Array {
    return this.data
  }

  public get byteLength(): number {
    return this.data.byteLength
  }

  constructor(size: number)
  constructor(data: ArrayBuffer)
  constructor(arg: number | ArrayBuffer) {
    
    this.data = new Uint8Array(
      arg instanceof ArrayBuffer ? arg : new ArrayBuffer(arg)
    )

    this.position = 0
  }

  public read (size: number): Uint8Array {
    // If the size is greater than the remaining buffer, we should only read the remaining buffer
    if (this.position + size > this.data.byteLength) {
      size = this.data.byteLength - this.position
    }

    const chunk = this.data.slice(this.position, this.position + size)
    this.position += size
    
    return chunk
  }

  public readExact (size: number): Uint8Array {
    // If the size is greater than the remaining buffer, we should throw an error
    if (this.position + size > this.data.byteLength) {
      throw new Error('Unable to read exact amount of data: not enough bytes available.');
    }
    const chunk = this.data.slice(this.position, this.position + size)
    this.position += size
    
    return chunk
}

  public write (data: Uint8Array): void {
    // If the buffer is too small, we should create a new buffer with the correct size
    if (this.position + data.byteLength > this.data.byteLength) {
      const buffer = new Uint8Array(this.position + data.byteLength)
      buffer.set(this.data)

      this.data = buffer
    }
    
    this.data.set(data, this.position)
    this.position += data.byteLength
  }

  public seek (
    offset: number, 
    whence: 'start' | 'current' | 'end' = 'current'
  ): void {
    switch (whence) {
      case 'start':
        this.position = offset
        break;
      case 'current':
        this.position += offset;
        break
      case 'end':
        this.position = this.data.byteLength + offset
        break
    }

    if (this.position < 0) {
      this.position = 0
    } else if (this.position > this.data.byteLength) {
      this.position = this.data.byteLength
    }
  }
}
