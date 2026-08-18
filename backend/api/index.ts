// api/index.ts — Vercel Serverless Function entrypoint
import app from '../src/app';
import { connectDatabase } from '../src/config/database';
import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // 1. Immediately handle CORS headers
  const origin = (req.headers.origin as string) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin'
  );

  // 2. Immediate 200 OK response for OPTIONS preflight (never block on DB)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDatabase();
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless execution error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server connection error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
