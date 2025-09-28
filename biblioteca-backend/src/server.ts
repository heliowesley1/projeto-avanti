import 'dotenv/config'; 
import express from 'express'; 
import cors from 'cors'; 
import type { Express } from 'express'; 
import livroRouter from './routes/livro.routes'; 
import categoriaRouter from './routes/categoria.routes';
import autorRouter from './routes/autor.routes'; 
import emprestimoRouter from './routes/emprestimo.routes'; 
import reservaRouter from './routes/reserva.routes'; 

const app: Express = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: 'http://localhost:5173', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json()); 

app.use('/api/livros', livroRouter);
app.use('/api/categorias', categoriaRouter);
app.use('/api/autores', autorRouter); 
app.use('/api/emprestimos', emprestimoRouter); 
app.use('/api/reservas', reservaRouter); 

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});