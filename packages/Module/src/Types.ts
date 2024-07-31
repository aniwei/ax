import { Instruction } from './Instructions'

/// Wasm types
export interface WasmHeader {
  magic: string
  version: number
}

/// Wasm sections
export interface Memory {
  limits: Limits
}

export interface Table {
  limits: Limits
  type: number
}

export interface Limits {
  min: number
  max: number | null
}

export enum ValueId {
  I32, // 0x7F
  I64, // 0x7E
  F32, // 0x7D
  F64, // 0x7C
}

export interface Function {
  params: ValueId[]
  results: ValueId[]
}

export interface FunctionLocal {
  count: number,
  value: ValueId,
}

export interface FunctionBody {
  locals: FunctionLocal[],
  code: Instruction[],
}

export enum ExportDescriptionId {
  Func,
  Table,
  Memory,
  Global,
}

export interface ExportDescription {
  id: ExportDescriptionId,
  index: number,
}

export interface Export {
  name: string,
  description: ExportDescription,
}

export enum BlockId {
  Empty = 0x40,
  Value,
}

export interface Block {
  id: BlockId,
  value?: ValueId[],
}