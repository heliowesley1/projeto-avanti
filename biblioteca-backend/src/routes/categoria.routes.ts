// biblioteca-backend/src/routes/categoria.routes.ts (CÓDIGO FINAL E ESTÁVEL)

import { Router } from 'express';
import type { Categoria as CategoriaPrisma } from '@prisma/client';
import prisma from '../prisma';

const categoriaRouter = Router();

// Função de utilidade para mapear 'id' para '_id' e converter para snake_case
const mapCategoriaToFrontend = (categoria: CategoriaPrisma) => ({
    _id: categoria.id,
    nome: categoria.nome,
    codigo: categoria.codigo,
    descricao: categoria.descricao ?? "", // Garante string vazia
    cor: categoria.cor ?? "", // Garante string vazia
    ativa: categoria.ativa,
    ordem: categoria.ordem ?? 1, // Garante 1 (number)
    total_livros: categoria.totalLivros ?? 0, // Garante 0 (number)
    createdAt: categoria.createdAt.toISOString(),
    updatedAt: categoria.updatedAt.toISOString(),
});

// [GET] /api/categorias: Listar todos (COM ORDENAÇÃO SIMPLIFICADA)
categoriaRouter.get('/', async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({ 
            // CORREÇÃO: Remove a ordenação problemática e usa apenas 'nome'
            orderBy: { nome: 'asc' } 
        });
        return res.json(categorias.map(mapCategoriaToFrontend));
    } catch (error) {
         console.error('ERRO CRÍTICO AO LISTAR CATEGORIAS (DB/PRISMA):', error);
         return res.status(500).json({ error: 'Erro ao listar categorias. Verifique a conexão com o banco de dados.' });
    }
});

// [POST] /api/categorias: Criar nova
categoriaRouter.post('/', async (req, res) => {
    const { ordem, total_livros, ativa, descricao, cor, ...rest } = req.body;
    
    const dataToPrisma = {
        ...rest,
        ordem: ordem ? parseInt(ordem) : 1,
        totalLivros: total_livros ? parseInt(total_livros) : 0, 
        ativa: ativa === 'true' || ativa === true,
        descricao: descricao || null, // Permite null no Prisma
        cor: cor || null,
    }

    try {
        const novaCategoria = await prisma.categoria.create({
            data: dataToPrisma,
        });
        return res.status(201).json(mapCategoriaToFrontend(novaCategoria));
    } catch (error) {
        // Trata erro de código duplicado (P2002)
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2002') {
             return res.status(400).json({ error: 'Erro ao salvar: Código de categoria já em uso.' });
        }
        console.error('Erro ao criar categoria:', error);
        return res.status(400).json({ error: 'Erro ao salvar categoria. Verifique os campos.' });
    }
});

// [PUT] /api/categorias/:id: Atualizar
categoriaRouter.put('/:id', async (req, res) => {
    const { ordem, total_livros, ativa, descricao, cor, ...rest } = req.body;
    const data: any = { ...rest };
    
    if (ordem !== undefined) data.ordem = parseInt(ordem);
    if (total_livros !== undefined) data.totalLivros = parseInt(total_livros);
    if (ativa !== undefined) data.ativa = (ativa === 'true' || ativa === true);
    
    if (descricao !== undefined) data.descricao = descricao || null;
    if (cor !== undefined) data.cor = cor || null;

    try {
        const categoriaAtualizada = await prisma.categoria.update({
            where: { id: req.params.id },
            data: data,
        });
        return res.json(mapCategoriaToFrontend(categoriaAtualizada));
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
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
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Categoria não encontrada para exclusão.' });
        }
        return res.status(500).json({ error: 'Erro ao deletar categoria.' });
    }
});

export default categoriaRouter;