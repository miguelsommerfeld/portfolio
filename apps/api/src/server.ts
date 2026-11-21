import fastify from "fastify";

export const server = fastify({ logger:true })

server.listen({ port: 3333, host: "0.0.0.0"})
