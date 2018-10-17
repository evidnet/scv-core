import rimraf from 'rimraf'

export function removeFileOrDirectory (path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    rimraf(path, (err) => {
      if (err) reject()
      resolve()
    })
  })
}
