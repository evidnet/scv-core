import caporal from 'caporal'
import { BaseCommand } from './BaseCommand'
import { Caporal } from './BaseTypes'

/**
 * Base Command-line Application Definition
 *
 * @export
 * @abstract
 * @class BaseApplication
 */
export abstract class BaseApplication {
  abstract version: string
  abstract commands: BaseCommand[]

  // 만든 커맨드를 Caporal을 통해 인식하도록 등록
  private injectCaporal (instance: Caporal, command: BaseCommand) {
    const caporalCommand = instance
      .command(command.getCommandName(), command.getCommandDescription())
      .alias(command.getCommandAlias())

    command.getArguments().forEach(({ key, description, defaultValue }) => {
      caporalCommand.argument(key, description, defaultValue)
    })

    command.getOptions().forEach(({ key, description, required, defaultValue }) => {
      caporalCommand.option(key, description, undefined, defaultValue, required)
    })

    caporalCommand.action(async (args, options, logger) => {
      const result = command.onEvaluated(args, options, logger)

      // check result is promise!
      if (Promise.resolve(result) !== result) return
      try {
        await result
      } catch (err) {
        logger.error(err)
        logger.error(err.stack)
      }
    })
  }

  /**
   * Start Command line Application
   *
   * @param {boolean} [doParse=true] use directly parse
   * @param {any} [parseElement=process.argv] parsable value for caporal
   * @returns caporal raw object
   * @memberof BaseApplication
   */
  start (doParse: boolean = true, parseElement: any = process.argv): Caporal {
    caporal.version(this.version)
    this.commands.forEach(cmd => this.injectCaporal(caporal, cmd))
    if (doParse) caporal.parse(parseElement)

    return caporal
  }
}
