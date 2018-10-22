import test from 'ava'
import caporal from 'caporal'
import path from 'path'
import { BuildImageCommand } from '../src/commands/BuildImageCommand'
import { removeFileOrDirectory } from '../src/utils/removeFileOrDirectory'
import { TagValue, OptionModel } from '../src/abstraction/BaseTypes'

class TestCommand extends BuildImageCommand {
  substituteMap: Map<string, TagValue> = new Map<string, TagValue>([
    ['@tag', (tag?: string) => (tag === undefined ? '' : tag)]
  ])

  tags: string[] = ['hello', 'world']
  imageName: string = 'scv/test'
  dockerFile: string = './assets/TestDockerfile.template'

  getCommandAlias (): string {
    return 't'
  }

  getOptions (): Array<OptionModel> {
    return []
  }
}

test.before(async t => {
  const tempPath = path.join(process.cwd(), './.tmp/')
  await removeFileOrDirectory(tempPath)
})

test('Building Test Dockerfile.', async t => {
  const command = new TestCommand()

  try {
    await command.onEvaluated({}, {}, caporal.logger())
    t.pass()
  } catch (ex) {
    console.error(ex)
    t.fail('Failure to Build Image')
  }
})
