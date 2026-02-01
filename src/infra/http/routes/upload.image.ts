import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

import { isRight, unwrapEither } from '@/infra/shared/either'

import { UploadImage } from '../app/use-case/upload-image'

export const uploadImageRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        consumes: ['multipart/form-data'],
        response: {
          201: z.null().describe('Image uploaded'),
          400: z.object({ message: z.string() }),
        },
      },
    },

    async (request, reply) => {
      const uploadFile = await request.file({
        limits: {
          fileSize: 1024 * 1024 * 2, // 2mb
        },
      })

      if (!uploadFile) {
        return reply.status(400).send({ message: 'File in requered' })
      }

      const result = await UploadImage({
        fileName: uploadFile.filename,
        contentType: uploadFile.mimetype,
        contentStrem: uploadFile.file,
      })

      if (isRight(result)) {
        return reply.status(201).send()
      }

      const error = unwrapEither(result)

      switch (error.constructor.name) {
        case 'InvalidFileForm':
          return reply.status(400).send({ message: error.message })
      }
    }
  )
}
