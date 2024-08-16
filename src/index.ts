import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import dotenv from 'dotenv';
import fastifyEnv from '@fastify/env';
import { EnvSchema, EnvType } from './env';

dotenv.config();

async function main() {
  const fastify = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  await fastify.register(fastifyEnv, {
    schema: EnvSchema,
    dotenv: true,
  });

  const config = (fastify as unknown as {config: EnvType}).config;

  const behaviors = {
    error: config.CHAOS_MONKEY_ERROR_RESPONSE_CHANCE,
    delay: config.CHAOS_MONKEY_DELAY_RESPONSE_CHANCE,
    noResponse: config.CHAOS_MONKEY_NO_RESPONSE_CHANCE,
  };  

  const pickWeightedAction = () => {
    let randomWeight = Math.floor(Math.random() * 100)
    for (const [action, weight] of Object.entries(behaviors)) {
      if (randomWeight < weight) {
        return action as keyof typeof behaviors;
      }
      randomWeight -= weight;
    }
    return null; // no action
  };

  fastify.log.info({
    behaviorChances: Object.fromEntries(
      Object.entries(behaviors).map(([action, weight]) => [action, `${weight.toFixed(2)}%`])
    )
  });

  fastify.addHook('onRequest', async (request, reply) => {
    const logPrefix = `Request ${request.method} ${request.url}:`;
    const action = pickWeightedAction();

    switch (action) {
      case 'error':
        fastify.log.warn(`${logPrefix} Triggered 500 Chaos Monkey Error`);
        reply.status(500).send('Chaos Monkey Error!');
        return;

      case 'delay':
        const delay = config.CHAOS_MONKEY_DELAY_RESPONSE_DURATION * 1000;
        fastify.log.warn(`${logPrefix} Delaying response by ${delay} ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        break;

      case 'noResponse':
        fastify.log.warn(`${logPrefix} Not responding (indefinite timeout)`);
        reply.raw.setTimeout(0); // Disable server timeout for this specific request
        await new Promise(() => {}); // Simulate hanging request indefinitely
        return;

      default:
        // No action
        break;
    }
  });

  fastify.route({
    url: '*',
    method: ['GET', 'POST'],
    handler: async (_req, reply) => {
      await reply.send('OK');
    }
  });

  await fastify.ready();
  await fastify.listen({ port: config.CHAOS_MONKEY_PORT, host: '0.0.0.0' });
  fastify.log.info(`Server running`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
