// api/index.ts — Vercel Serverless Function entrypoint
import app from '../src/app';
import { connectDatabase } from '../src/config/database';
import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
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
