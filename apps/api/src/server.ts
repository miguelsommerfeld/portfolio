import fastify from "fastify";
import { env } from "@shared/config/env"

export const server = fastify({ logger:true })

server.listen({ port: 3333, host: "0.0.0.0"})
