// src/routes/categoria.routes.ts

import { Router } from 'express';
import type { Categoria as CategoriaPrisma } from '@prisma/client';
import prisma from '../prisma';

const categoriaRouter = Router();

const mapCategoriaToFrontend = (categoria: CategoriaPrisma) => ({
    ...categoria,
    _id: categoria.id,
});

// [GET] /api/categorias: Listar todos
categoriaRouter.get('/', async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({ 
            orderBy: { ordem: 'asc', nome: 'asc' } 
        });
        return res.json(categorias.map(mapCategoriaToFrontend));
    } catch (error) {
         return res.status(500).json({ error: 'Erro ao listar categorias.' });
    }
});

// [POST] /api/categorias: Criar nova
categoriaRouter.post('/', async (req, res) => {
    const { ordem, totalLivros, ativa, ...rest } = req.body;
    try {
        const novaCategoria = await prisma.categoria.create({
            data: {
                ...rest,
                // Converte numéricos e booleanos
                ordem: ordem ? parseInt(ordem) : 1,
                totalLivros: totalLivros ? parseInt(totalLivros) : 0,
                ativa: ativa === 'true' || ativa === true,
            },
        });
        return res.status(201).json(mapCategoriaToFrontend(novaCategoria));
    } catch (error) {
        return res.status(400).json({ error: 'Erro ao criar categoria. Código já pode existir.' });
    }
});

// [PUT] /api/categorias/:id: Atualizar
categoriaRouter.put('/:id', async (req, res) => {
    const data = req.body;
    try {
        const categoriaAtualizada = await prisma.categoria.update({
            where: { id: req.params.id },
            data: { 
                ...data,
                // Conversão condicional
                ordem: data.ordem ? parseInt(data.ordem) : undefined,
                totalLivros: data.totalLivros ? parseInt(data.totalLivros) : undefined,
                ativa: data.ativa !== undefined ? (data.ativa === 'true' || data.ativa === true) : undefined,
            },
        });
        return res.json(mapCategoriaToFrontend(categoriaAtualizada));
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ error: 'Categoria não encontrada para atualização.' });
        }
        return res.status(400).json({ error: 'Erro ao atualizar categoria.' });
    }
});

// [DELETE] /api/categorias/:id: Deletar
categoriaRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.categoria.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ error: 'Categoria não encontrada para exclusão.' });
        }
        return res.status(500).json({ error: 'Erro ao deletar categoria.' });
    }
});

export default categoriaRouter;