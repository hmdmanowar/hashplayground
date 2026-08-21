import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

// A deliberately-thrown, expected error with an HTTP status attached —
// distinct from an unexpected bug, which falls through to a generic 500.
export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function errorHandler(error: FastifyError | ApiError, request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof ApiError) {
    reply.status(error.status).send({ message: error.message, code: error.code })
    return
  }

  // Fastify schema-validation failures already carry a 400 + useful message.
  if ('validation' in error && error.validation) {
    reply.status(400).send({ message: error.message })
    return
  }

  request.log.error(error)
  reply.status(500).send({ message: 'Internal server error' })
}
