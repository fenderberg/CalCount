import { buildApp } from './app.js';

const app = await buildApp();

// `||` i.p.v. `??`: een lege PORT= regel in .env geeft process.env.PORT = ''
// (niet undefined), wat Number('') = 0 zou opleveren (Fastify kiest dan een
// willekeurige poort) — zie dezelfde aanpak in services/aiEstimate.ts.
const port = Number(process.env.PORT) || 3001;
try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
