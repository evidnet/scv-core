import test from 'ava'

import { BaseApplication } from '../src/abstraction/BaseApplication'
import { BaseCommand } from '../src/abstraction/BaseCommand'

const version = 'v1.0.0'
class TestApplication extends BaseApplication {
  version: string = version
  commands: BaseCommand[] = []
}

const app: any = new TestApplication().start(false)

test("Test Application's commands must be empty.", t => {
  t.is(app.getCommands().length, 0)
})

test("Test Application's version must be equal as registered.", t => {
  t.is(app.version(), version)
})
