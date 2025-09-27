// src/server.ts (Versão Limpa)

import 'dotenv/config'; 
import express from 'express'; 
import cors from 'cors'; 
import type { Request, Response, Express } from 'express'; // Tipos importados separadamente
import livroRouter from './routes/livro.routes'; 
import categoriaRouter from './routes/categoria.routes';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); 

// Rotas
app.use('/api/livros', livroRouter);
app.use('/api/categorias', categoriaRouter);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});