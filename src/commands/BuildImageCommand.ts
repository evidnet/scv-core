import Docker from 'dockerode'
import fs from 'fs'
import util from 'util'
import { BaseCommand, KVMap } from '../abstraction/BaseCommand'
import generateUUID from '../utils/generateUuid'
import streamPromise from '../utils/streamPromise'
import { removeFileOrDirectory } from '../utils/removeFileOrDirectory'
import { sleep } from '../utils/sleep'

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const createDirectory = util.promisify(fs.mkdir)

type TagCallback = ((tag: string) => string)
type TagValue = string | TagCallback

/**
 * Command for Base Build Definition for Docker Image.
 *
 * @export
 * @abstract
 * @class BuildImageCommand
 * @extends {BaseCommand}
 */
export abstract class BuildImageCommand extends BaseCommand {
  /**
   * Base Image for build. Default is 64-bit Ubuntu 18.04
   *
   * @type {string}
   * @memberof BuildImageCommand
   */
  baseProject: string = 'amd64/ubuntu:18.04'

  /**
   * Map for substitute template code.
   *
   * @abstract
   * @type {Map<string, TagValue>}
   * @memberof BuildImageCommand
   */
  abstract substituteMap: Map<string, TagValue>

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
    return new Map<string, string>()
  }

  async onEvaluated (_: KVMap, __: KVMap, logger: Logger): Promise<void> {
    let remains = this.tags.length
    const docker = new Docker()

    logger.info('------------------------------------------')
    logger.info('Start to build container images...')
    logger.info(`${remains} Images remained.`)
    logger.info('------------------------------------------')

    await createDirectory('./.tmp')
    await Promise.all(
      this.tags.map(tag => ({ tag, uuid: generateUUID() })).map(async t => {
        const { tag, uuid } = t

        // read and substitute
        let template = await readFile(this.dockerFile, 'utf8')
        this.substituteMap.forEach((value, key) => {
          // check if it is function, evaluate it.
          const result = typeof value === 'function' ? value.apply(null, [tag]) : value
          template = template.split(key).join(result)
        })

        // write
        const fileName = `Dockerfile-tmp-${uuid}`
        await writeFile('./.tmp/' + fileName, template, 'utf8')

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
        } catch (err) {
          // log it and remove temporary file
          logger.error(err)
          logger.error(err.stack)
        }

        logger.info(`Building Image [${tag}] finished.`)
        logger.info(--remains > 0 ? `${remains} Images remained.` :
                                    `No More Remained. Build Finished.`)
        logger.info('------------------------------------------')
      })
    )

    await sleep(3000)
    await removeFileOrDirectory('./.tmp/')
    logger.info('All Temporary Files are removed.')
    logger.info('------------------------------------------')
  }
}
