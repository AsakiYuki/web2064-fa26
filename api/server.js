// Keep the serverless deployment on the same authenticated API implementation
// as local development. server.js skips listen() when Vercel is set.
export { default } from '../server.js'
