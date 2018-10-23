export interface Logger {
  debug (str: string): void
  info (str: string): void
  log (str: string): void
  warn (str: string): void
  error (str: string): void
}

export type helpOptions = {
  indent?: boolean
  name?: string
}

export type ActionCallback = (args: { [k: string]: any }, options: { [k: string]: any }, logger: Logger) => void

export type ValidatorArg = string[] | string | RegExp | ValidatorFn | Number

export type ValidatorFn = (str: string) => any

export interface Caporal {
  INTEGER: number
  INT: number
  FLOAT: number
  BOOL: number
  BOOLEAN: number
  STRING: number
  LIST: number
  ARRAY: number
  REPEATABLE: number
  REQUIRED: number

  version (ver: string): Caporal
  version (): string
  name (name: string): Caporal
  name (): string
  description (name: string): Caporal
  description (): string
  logger (logger: Logger): Caporal
  logger (): Logger
  bin (name: string): Caporal
  bin (): string
  help (helpText: string, helpOptions?: helpOptions): Caporal
  command (synospis: string, description: string): Command
  action (cb: ActionCallback): Caporal
  option (
    synopsis: string,
    description: string,
    validator?: ValidatorArg,
    defaultValue?: any,
    required?: boolean
  ): Caporal
  argument (synopsis: string, description: string, validator?: ValidatorArg, defaultValue?: any): Command
  parse (argv: string[]): any
  fatalError (error: Error): void
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
