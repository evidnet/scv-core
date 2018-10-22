export interface Logger {
  debug (str: string): void
  info (str: string): void
  log (str: string): void
  warn (str: string): void
  error (str: string): void
}

export interface OptionModel {
  key: string
  description: string
  required?: boolean
  defaultValue?: any
}

export type ValueFunction = ((tag: string, args?: KVMap, options?: KVMap) => string)

export type AsyncValueFunction = ((tag: string, args?: KVMap, options?: KVMap) => Promise<string>)

export type TagValue = string | ValueFunction | AsyncValueFunction

export type KVMap = { [k: string]: any }
