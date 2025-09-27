// src/routes/livro.routes.ts (Implementação Completa e Final)

import { Router } from 'express';
// O modo CJS (CommonJS) é mais estável aqui
import type { Livro as LivroPrisma } from '@prisma/client'; 
import prisma from '../prisma'; // Importação CJS (SEM o .js)

const livroRouter = Router();

// Função de utilidade para mapear 'id' para '_id'
const mapLivroToFrontend = (livro: LivroPrisma) => ({
    ...livro,
    _id: livro.id,
});

// [GET] /api/livros/:id: Obter por ID
livroRouter.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const livro = await prisma.livro.findUnique({
            where: { id: id },
        });

        if (!livro) {
            return res.status(404).json({ error: 'Livro não encontrado com o ID fornecido.' });
        }
        
        return res.json(mapLivroToFrontend(livro));

    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar livro por ID.' });
    }
});

// [GET] /api/livros: Listar todos
livroRouter.get('/', async (req, res) => {
    try {
        const livros = await prisma.livro.findMany({ 
            orderBy: { createdAt: 'desc' } 
        });
        
        return res.json(livros.map(mapLivroToFrontend));

    } catch (error) {
         return res.status(500).json({ error: 'Erro ao listar livros.' });
    }
});

// [POST] /api/livros: Criar
livroRouter.post('/', async (req, res) => {
    const { anoPublicacao, quantidadeTotal, quantidadeDisponivel, ...rest } = req.body;
    try {
        const novoLivro = await prisma.livro.create({
            data: {
                ...rest,
                anoPublicacao: parseInt(anoPublicacao),
                quantidadeTotal: parseInt(quantidadeTotal) || 1,
                quantidadeDisponivel: parseInt(quantidadeDisponivel) || 1,
                disponivel: (parseInt(quantidadeDisponivel) || 1) > 0,
            },
        });
        
        return res.status(201).json(mapLivroToFrontend(novoLivro));

    } catch (error) {
        return res.status(400).json({ error: 'Erro ao criar livro. Verifique os dados fornecidos.' });
    }
});

// [PUT] /api/livros/:id: Atualizar
livroRouter.put('/:id', async (req, res) => {
    const data = req.body;
    try {
        const livroAtualizado = await prisma.livro.update({
            where: { id: req.params.id },
            data: { 
                ...data,
                anoPublicacao: data.anoPublicacao ? parseInt(data.anoPublicacao) : undefined,
                quantidadeTotal: data.quantidadeTotal ? parseInt(data.quantidadeTotal) : undefined,
                quantidadeDisponivel: data.quantidadeDisponivel ? parseInt(data.quantidadeDisponivel) : undefined,
                disponivel: data.quantidadeDisponivel !== undefined ? (parseInt(data.quantidadeDisponivel) > 0) : undefined,
            },
        });
        
        return res.json(mapLivroToFrontend(livroAtualizado));

    } catch (error) {
        // CORREÇÃO TS18046 (Linha ~96)
        // Verifica se o erro é um objeto e tem a propriedade 'code' (P2025 é o código do Prisma)
        if (typeof error === 'object' && error !== null && 'code' in error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Livro não encontrado para atualização.' });
            }
        }
        return res.status(400).json({ error: 'Erro ao atualizar livro. Verifique os dados.' });
    }
});

// [DELETE] /api/livros/:id: Deletar
livroRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.livro.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    } catch (error) {
        // CORREÇÃO TS18046 (Linha ~111)
        // Verifica se o erro é um objeto e tem a propriedade 'code'
        if (typeof error === 'object' && error !== null && 'code' in error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Livro não encontrado para exclusão.' });
            }
        }
        return res.status(500).json({ error: 'Erro ao deletar livro.' });
    }
});

export default livroRouter;