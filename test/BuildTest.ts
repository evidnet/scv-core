import test from 'ava'
import caporal from 'caporal'
import path from 'path'
import { BuildImageCommand, TagCallback } from '../src/commands/BuildImageCommand'
import { removeFileOrDirectory } from '../src/utils/removeFileOrDirectory'

class TestCommand extends BuildImageCommand {
  substituteMap: Map<string, TagCallback> = new Map<string, TagCallback>([
    ['@tag', (tag?: string) => (tag === undefined ? '' : tag)]
  ])
  tags: string[] = ['hello', 'world']
  imageName: string = 'scv/test'
  dockerFile: string = './assets/TestDockerfile.template'

  getCommandAlias (): string {
    return 't'
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
