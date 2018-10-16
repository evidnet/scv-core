import Docker from 'dockerode'
import fs from 'fs'
import util from 'util'
import { BaseCommand, KVMap } from '../abstraction/BaseCommand'
import generateUUID from '../utils/generateUuid'
import streamPromise from '../utils/streamPromise'

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const removeFile = util.promisify(fs.unlink)

/**
 * Command for Base Build Definition for Docker Image.
 *
 * @export
 * @abstract
 * @class BuildImageCommand
 * @extends {BaseCommand}
 */
export default abstract class BuildImageCommand extends BaseCommand {
  /**
   * Map for substitute template code.
   *
   * @abstract
   * @type {Map<string, string>}
   * @memberof BuildImageCommand
   */
  abstract substituteMap: Map<string, string>

  /**
   * Tag List to Build Docker Image.
   *
   * @abstract
   * @type {string[]}
   * @memberof BuildImageCommand
   */
  abstract tags: string[]

  /**
   * Image's name.
   *
   * @abstract
   * @type {string}
   * @memberof BuildImageCommand
   */
  abstract imageName: string

  /**
   * Path of Dockerfile.
   * CAUTION: MUST BE ENCODED AS UTF-8
   *
   * @abstract
   * @type {string}
   * @memberof BuildImageCommand
   */
  abstract dockerFile: string

  getCommandName (): string {
    return 'build'
  }

  getCommandAliases (): string[] {
    return ['b']
  }

  getCommandDescription (): string {
    return 'Build Docker Images'
  }

  getArguments (): Map<string, string> {
    return new Map<string, string>([['[baseProject]', "Base Project's name."]])
  }

  async onEvaluated (args: KVMap, _: KVMap, logger: Logger): Promise<void> {
    let { baseProject } = args
    if (!baseProject) baseProject = 'amd64/ubuntu:18.04'

    let remains = this.tags.length
    const docker = new Docker()

    logger.info('------------------------------------------')
    logger.info('Start to build container images...')
    logger.info(`${remains} Images remained.`)
    logger.info('------------------------------------------')

    await Promise.all(
      this.tags.map(tag => ({ tag, uuid: generateUUID() })).map(async t => {
        const { tag, uuid } = t

        // read and substitute
        let template = await readFile(this.dockerFile, 'utf8')
        this.substituteMap.forEach((value, key) => (template = template.split(key).join(value)))

        // write
        const fileName = `Dockerfile-tmp-${uuid}`
        await writeFile('./' + fileName, template, 'utf8')

        try {
          // build
          const stream = await docker.buildImage(
            {
              context: process.cwd(),
              src: [fileName]
            },
            {
              t: `${this.imageName}:v${tag}`,
              dockerfile: fileName
            }
          )

          // await build stream and remove
          await streamPromise(stream, logger)
          await removeFile('./' + fileName)
        } catch (err) {
          logger.error(err)
          logger.error(err.stack)
          await removeFile('./' + fileName)
        }

        logger.info(`Building Image [${tag}] finished.`)
        if (--remains > 0) logger.info(`${remains} Images remained.`)
        else logger.info(`No More Remained. Build Finished.`)
        logger.info('------------------------------------------')
      })
    )
  }
}
