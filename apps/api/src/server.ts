import fastify from "fastify"
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler
} from "@fastify/type-provider-zod";
import { AuthService } from "./modules/auth/auth.service";

export const server = fastify({ logger:true }).withTypeProvider<ZodTypeProvider>();
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.decorate('authService', new AuthService)

server.listen({ port: 3333, host: "0.0.0.0"})
