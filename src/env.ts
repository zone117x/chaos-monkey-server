import { Type, Static } from '@sinclair/typebox';

export const EnvSchema = Type.Object({
  CHAOS_MONKEY_PORT: Type.Number({ default: 9222 }),
  CHAOS_MONKEY_ERROR_RESPONSE_CHANCE: Type.Number({ default: 10 }),
  CHAOS_MONKEY_NO_RESPONSE_CHANCE: Type.Number({ default: 5 }),
  CHAOS_MONKEY_DELAY_RESPONSE_CHANCE: Type.Number({ default: 5 }),
  CHAOS_MONKEY_DELAY_RESPONSE_DURATION: Type.Number({ default: 5, description: 'Number of seconds to delay, if response is delayed' }),
});

export type EnvType = Static<typeof EnvSchema>;