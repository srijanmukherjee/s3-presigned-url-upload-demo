import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-providers';
import cors from 'cors';
import z from 'zod';
import { acontroller } from './util';

const app = express();
const port = process.env.PORT || 8000;

const s3Client = new S3Client({
    credentials: fromEnv(),
    region: process.env.AWS_DEFAULT_REGION
});

app.use(express.json());
app.use(cors());

const uploadSchema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1)
});

app.get('/download/:filename', acontroller(async (req, res) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `uploads/user-uploads/${req.params.filename}`
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 5 * 60 });
    
    return res.json({ url });
}));

app.post('/upload', acontroller(async (req: Request, res: Response) => {
    const validatedData = uploadSchema.safeParse(req.body);
    if (!validatedData.success) {
        return res.status(400).json({ error: validatedData.error });
    }

    const { filename, contentType } = validatedData.data;
    
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `uploads/user-uploads/${filename}`,
        ContentType: contentType
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 5 * 60 });

    return res.json({ url });
}));

app.listen(port, () => {
    console.log(`Listening on localhost:${port}`);
});