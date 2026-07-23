import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import awsLambdaFastify from 'aws-lambda-fastify';
import { buildApp } from '../../api/src/app.js';

let proxy: ReturnType<typeof awsLambdaFastify> | undefined;

async function getProxy() {
  if (!proxy) {
    const app = await buildApp();
    proxy = awsLambdaFastify(app);
  }
  return proxy;
}

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
  const fastifyProxy = await getProxy();
  return fastifyProxy(event, context);
};
