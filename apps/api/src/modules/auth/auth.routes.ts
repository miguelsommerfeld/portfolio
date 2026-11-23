import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import type { FastifyTypedInstance } from "@/types/fastify"

const authRoutes: FastifyPluginAsyncZod = async function (server: FastifyTypedInstance) {
  server.get('/login/google', {
    schema: {
      response: {
        204: null,
      },
    },
    handler: async (req, res) => {
      const providerConfig = server.authService.googleAuthentication();
    }
  })

  server.get('/login/github', {
    schema: {
      response: {
        204: null,
      },
    },
    handler: async (req, res) => {
      const providerConfig = server.authService.googleAuthentication();
    }
  })
}