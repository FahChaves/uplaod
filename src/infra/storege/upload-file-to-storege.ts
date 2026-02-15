import { randomUUID } from 'node:crypto'
import { basename, extname } from 'node:path'
import { Readable } from 'node:stream'

import { Upload } from '@aws-sdk/lib-storage'
import z from 'zod'

import { env } from '@/env'

import { r2 } from './client'

const uploadFileToStoregeInput = z.object({
  folder: z.enum(['images', 'downloads']),
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

type uploadFileToStorege = z.input<typeof uploadFileToStoregeInput>

export async function uploadFileToStorage(input: uploadFileToStorege) {
  const { contentStream, contentType, fileName, folder } =
    uploadFileToStoregeInput.parse(input)

  const fileExtension = extname(fileName)
  const fileNameWhithoutExtension = basename(fileName)

  const sanitizedFileName = fileNameWhithoutExtension.replace(
    /[^a-zA-Z0-9]/g,
    ''
  )
  const sanitizedFileNameWithExtension = sanitizedFileName.concat(fileExtension)

  const uniqueFileName = `${folder}/${randomUUID()}-${sanitizedFileNameWithExtension}`

  const upload = new Upload({
    client: r2,
    params: {
      Key: uniqueFileName,
      Bucket: env.CLOUDFLARE_BUCKET,
      Body: contentStream,
      ContentType: contentType,
    },
  })

  await upload.done()

  return {
    key: uniqueFileName,
    url: new URL(uniqueFileName, env.CLOUDFLARE_PUBLIC_URL).toString(),
  }
}
