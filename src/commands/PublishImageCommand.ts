import Docker from 'dockerode'
import { BaseCommand } from '../abstraction/BaseCommand'
import { KVMap, OptionModel } from '../abstraction/BaseTypes'
import streamPromise from '../utils/streamPromise'

/**
 * Command for Base Publish Definition for Docker Image.
 *
 * @export
 * @abstract
 * @class PublishCommand
 * @extends {BaseCommand}
 */
export abstract class PublishImageCommand extends BaseCommand {
  abstract rootProject: string
  abstract project: string

  getCommandName (): string {
    return 'publish'
  }

  getCommandAlias (): string {
    return 'p'
  }

  getCommandDescription (): string {
    return 'Publish images to remote registry.'
  }

  getArguments (): Array<OptionModel> {
    return [
      {
        key: '<username>',
        description: 'ID of custom registry.'
      },
      {
        key: '<password>',
        description: 'Password of custom registry.'
      },
      {
        key: '<registry>',
        description: "Remote Registry's address."
      }
    ]
  }

  async onEvaluated (args: KVMap, _: KVMap, logger: Logger): Promise<void> {
    let { host, port, registry, rootProject, project, username, password } = args
    if (!rootProject) rootProject = this.rootProject
    if (!project) project = this.project

    const docker = host !== undefined && port !== undefined ? new Docker({ host, port }) : new Docker()
    const images = await docker.listImages({
      all: true,
      filters: { reference: [`${project}:*`] }
    })
    let remains = images.length

    logger.info('------------------------------------------')
    logger.info(`Start to deploy container images to [${registry}]`)
    logger.info(`${remains} Images founded from [${project}].`)
    logger.info('------------------------------------------')

    await Promise.all(
      images
        .map(image => ({ image: docker.getImage(image.Id), tag: image.RepoTags[0].split(':')[1] }))
        .map(async ({ image, tag }) => {
          const newPath = `${registry}/${rootProject}/${project}:${tag}`
          await image.tag({ repo: newPath, tag: tag })

          const stream = await docker.getImage(newPath).push({
            tag: tag,
            stream: true,
            authconfig: { serveraddress: registry, username, password }
          })

          await streamPromise(stream, logger)

          logger.info(`Deploying Image [${newPath}] finished.`)
          logger.info(--remains > 0 ? `${remains} Images remained.` :
                                      `No More Remained. Deployment Finished.`)
          logger.info('------------------------------------------')
        })
    )
  }
}
