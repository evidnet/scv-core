import _ from 'caporal'

/**
 * Wrap Stream to Promise.
 * it ignores emitted data, and when it close or end returned promise will resolved
 *
 * @export
 * @param {NodeJS.ReadableStream} stream stream to wrap
 * @param {Logger} logger for log emitted data.
 * @returns
 */
export default function streamPromise (stream: NodeJS.ReadableStream, logger?: Logger) {
  return new Promise((resolve, reject) => {
    stream.on('close', () => resolve())
    stream.on('end', () => resolve())
    stream.on('data', (data: Buffer) => {
      if (logger) logger.debug(data.toString('utf8'))
    })

    stream.on('error', err => reject(err))
  })
}
