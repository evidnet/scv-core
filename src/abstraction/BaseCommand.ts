export type KVMap = { [k: string]: any }

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
   * Define Command's Arguments.
   * See also {https://github.com/mattallty/Caporal.js#argumentsynopsis-description-validator-defaultvalue---command}
   * Key: synopsis, Value: description
   *
   * @abstract
   * @returns {string}
   * @memberof BaseCommand
   */
  abstract getArguments (): Map<string, string>

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
