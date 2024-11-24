import 'dotenv/config';
import express from 'express';
import { contentFetchRequestHandler } from './request_handler';

export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (!process.env.FEEDS_CONTENT_FETCH_TOKEN) {
    throw new Error(
      'FEEDS_CONTENT_FETCH_TOKEN environment variable is not set'
    );
  }

  app.get('/_ah/health', (_req, res) => res.sendStatus(200));

  app.all('/', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      console.error('request method is not GET or POST');
      return res.sendStatus(405);
    }

    if (req.query.token !== process.env.FEEDS_CONTENT_FETCH_TOKEN) {
      console.error('query does not include valid token');
      return res.sendStatus(403);
    }

    return contentFetchRequestHandler(req, res, next);
  });

  return app;
}
