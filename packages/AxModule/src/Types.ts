import { InstructionId } from './Instructions'

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

export enum ValueType {
  I32, // 0x7F
  I64, // 0x7E
  F32, // 0x7D
  F64, // 0x7C
}

export interface FuncType {
  params: ValueType[]
  results: ValueType[]
}

export interface FuncLocal {
  count: number,
  value: ValueType,
}

export interface FuncBody {
  locals: FuncLocal[],
  code: InstructionId[],
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