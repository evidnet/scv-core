import { OptionModel, KVMap } from './BaseTypes'

/**
 * Base Command's Abstracted Class Definition.
 *
 * @export
 * @abstract
 * @class BaseCommand
 */
export abstract class BaseCommand {
  /**
   * Define Command's Name
   *
   * @abstract
   * @returns {string}
   * @memberof BaseCommand
   */
  abstract getCommandName (): string

  /**
   * Define Command's Alias
   *
   * @abstract
   * @returns {string}
   * @memberof BaseCommand
   */
  abstract getCommandAlias (): string

  /**
   * Define Command's Description
   *
   * @abstract
   * @returns {string}
   * @memberof BaseCommand
   */
  abstract getCommandDescription (): string

  /**
   * Define Command's Arguments
   *
   * @abstract
   * @returns {Array<OptionModel>}
   * @memberof BaseCommand
   */
  abstract getArguments (): Array<OptionModel>

  /**
   * Define Command's Options
   *
   * @abstract
   * @returns {Array<OptionModel>}
   * @memberof BaseCommand
   */
  abstract getOptions (): Array<OptionModel>

  /**
   * Callback when command evaluated.
   *
   * @abstract
   * @param {KVMap} args Command-line args
   * @param {KVMap} options Command-line options
   * @param {Logger} logger Caporal's winston logger.
   * @returns {any} (You can use async onEvaluated too!)
   * @memberof BaseCommand
   */
  abstract onEvaluated (args: KVMap, options: KVMap, logger: Logger): any
}
