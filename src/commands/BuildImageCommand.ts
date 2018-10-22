import Docker from 'dockerode'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { BaseCommand } from '../abstraction/BaseCommand'
import { KVMap, TagValue, OptionModel } from '../abstraction/BaseTypes'
import generateUUID from '../utils/generateUuid'
import { removeFileOrDirectory } from '../utils/removeFileOrDirectory'
import { sleep } from '../utils/sleep'
import streamPromise from '../utils/streamPromise'

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const createDirectory = util.promisify(fs.mkdir)

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

  getArguments (): Array<OptionModel> {
    return []
  }

  async onEvaluated (args: KVMap, options: KVMap, logger: Logger): Promise<void> {
    let remains = this.tags.length
    const docker = new Docker()
    const tempPath = path.join(process.cwd(), './.tmp/')

    logger.info('------------------------------------------')
    logger.info('Start to build container images...')
    logger.info(`${remains} Images remained.`)
    logger.info('------------------------------------------')

    try {
      await removeFileOrDirectory(tempPath)
    } catch (_) {
      // ignored
    }

    await createDirectory(tempPath)
    await Promise.all(
      this.tags.map(tag => ({ tag, uuid: generateUUID() })).map(async ({ tag, uuid }) => {
        // read and substitute
        let template = await readFile(this.dockerFile, 'utf8')
        this.substituteMap.forEach((value, key) => {
          // check if it is function, evaluate it.
          const result = typeof value === 'function' ? value.apply(null, [tag, args, options]) : value
          template = template.split(key).join(result)
        })

        // write
        const fileName = `Dockerfile-tmp-${uuid}`
        await writeFile(path.join(tempPath, fileName), template, 'utf8')

        try {
          // build
          const stream = await docker.buildImage(
            {
              context: tempPath,
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
    await removeFileOrDirectory(tempPath)
    logger.info('All Temporary Files are removed.')
    logger.info('------------------------------------------')
  }
}
