import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { bodiesRouter } from './routes/bodies';
import { resourcesRouter } from './routes/resources';
import { researchRouter } from './routes/research';
import { logRouter } from './routes/log';
import { statusRouter } from './routes/status';
import { authMiddleware } from './middleware/auth';

export const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.use('/auth', authRouter);

app.use(authMiddleware);
app.use('/bodies', bodiesRouter);
app.use('/resources', resourcesRouter);
app.use('/research', researchRouter);
app.use('/log', logRouter);
app.use('/status', statusRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Terminus server running on port ${PORT}`);
});
