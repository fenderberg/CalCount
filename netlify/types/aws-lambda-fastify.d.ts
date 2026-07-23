// `aws-lambda-fastify` ships no types and DefinitelyTyped's stub targets an
// older Fastify major (breaks against Fastify 5's request/instance types).
// Minimal shape actually used here: wrap a Fastify instance into a
// Lambda-style (event, context) => Promise<result> handler.
declare module 'aws-lambda-fastify' {
  export default function awsLambdaFastify(
    app: unknown,
    options?: Record<string, unknown>
  ): (event: unknown, context: unknown) => Promise<unknown>;
}
