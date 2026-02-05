import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

import { unwrapEither } from '@/infra/shared/either'

import { getUpload } from '../app/use-case/get-uploads'

export const getUploadsRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    '/uploads',
    {
      schema: {
        summary: 'Get uploads',
        tags: ['uploads'],
        querystring: z.object({
          searchQuery: z.string().optional(),
          sortBy: z.enum(['createdAt']).optional(),
          sortDirection: z.enum(['asc', 'desc']),
          page: z.coerce.number().optional().default(1),
          pageSize: z.coerce.number().optional().default(20),
        }),
        response: {
          201: z.object({
            uploads: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                remoteKey: z.string(),
                remoteUrl: z.string(),
                createdAt: z.date(),
              })
            ),
            total: z.number(),
          }),
        },
      },
    },

    async (request, reply) => {
      const { page, pageSize, searchQuery, sortBy, sortDirection } =
        request.query

      const result = await getUpload({
        page,
        pageSize,
        searchQuery,
        sortBy,
        sortDirection,
      })

      const { total, uploads } = unwrapEither(result)

      return reply.status(201).send({ total, uploads })
    }
  )
}
