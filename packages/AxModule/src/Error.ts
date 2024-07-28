export class InvalidMemoryCount extends Error {
  constructor() {
    super('Invalid count of memory, must be 1')
  }
}


export class InvalidTableCount extends Error {
  constructor() {
    super('Invalid count of table, must be 1')
  }
}


export class InvalidElmType extends Error {
  constructor(type: number) {
    super(`Invalid elemtype of table, must be funcref, got ${type}`)
  }
}