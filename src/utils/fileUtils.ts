import fs from 'fs-extra'

export function remove (path: string): Promise<void> {
  return fs.remove(path)
}

export function ls (folder: string): Promise<Array<string>> {
  return fs.readdir(folder)
}

export function copy (origin: string, dest: string): Promise<void> {
  return fs.copy(origin, dest, {
    overwrite: true, recursive: true
  })
}
