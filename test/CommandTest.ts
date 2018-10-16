import test from 'ava'

import { BaseApplication } from '../src/abstraction/BaseApplication'
import { BaseCommand, KVMap } from '../src/abstraction/BaseCommand'

class TestApplication extends BaseApplication {
  version: string = 'v1.0.0'
  commands: BaseCommand[] = []
}

class TestCommand extends BaseCommand {
  getCommandName (): string {
    return 'test'
  }

  getCommandAlias (): string {
    return 't'
  }

  getCommandDescription (): string {
    return 'test command'
  }

  getArguments (): Map<string, string> {
    return new Map()
  }

  onEvaluated (args: KVMap, options: KVMap, logger: Logger) {
    logger.debug(args.toString())
    logger.debug(options.toString())
  }
}

const app = new TestApplication()
test('TestApplication and Test2Application is not same.', t => {
  t.plan(2)

  const caporal: any = app.start(false)
  t.is(caporal.getCommands().length, 0)

  app.commands = [ new TestCommand() ]
  app.start(false)
  t.is(caporal.getCommands().length, 1)
})
