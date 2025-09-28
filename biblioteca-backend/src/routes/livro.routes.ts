// biblioteca-backend/src/routes/livro.routes.ts (CORREÇÃO FINAL DE INSERT)

import { Router } from 'express';
import type { Livro as LivroPrisma } from '@prisma/client'; 
import prisma from '../prisma'; 

const livroRouter = Router();

// Função de utilidade para mapear 'id' para '_id' E converter para snake_case e tratar NULL
const mapLivroToFrontend = (livro: LivroPrisma) => ({
    _id: livro.id,
    titulo: livro.titulo,
    autor: livro.autor,
    isbn: livro.isbn,
    categoria: livro.categoria,
    ano_publicacao: livro.anoPublicacao,
    editora: livro.editora ?? "", 
    paginas: livro.paginas ?? 0, 
    sinopse: livro.sinopse ?? "",
    capa_url: livro.capaUrl ?? "",
    disponivel: livro.disponivel,
    quantidade_total: livro.quantidadeTotal,
    quantidade_disponivel: livro.quantidadeDisponivel,
    localizacao: livro.localizacao ?? "",
    createdAt: livro.createdAt.toISOString(),
    updatedAt: livro.updatedAt.toISOString(),
});

// ... (GET /:id e GET / mantidos) ...

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
         console.error('ERRO CRÍTICO AO LISTAR LIVROS (DB/PRISMA):', error);
         return res.status(500).json({ error: 'Erro ao listar livros. Verifique a conexão com o banco de dados.' });
    }
});

// [POST] /api/livros: Criar (CORREÇÃO DE INSERT)
livroRouter.post('/', async (req, res) => {
    const { ano_publicacao, quantidade_total, quantidade_disponivel, paginas, editora, sinopse, capa_url, localizacao, ...rest } = req.body;
    
    // Converte para null se o campo for undefined ou string vazia, caso contrário, usa o valor.
    const paginasPrisma = paginas !== undefined && paginas !== '' ? parseInt(paginas) : null;
    const editoraPrisma = editora || null;
    const sinopsePrisma = sinopse || null;
    const capaUrlPrisma = capa_url || null;
    const localizacaoPrisma = localizacao || null;

    const dataToPrisma = {
        ...rest,
        anoPublicacao: parseInt(ano_publicacao),
        quantidadeTotal: parseInt(quantidade_total) || 1,
        quantidadeDisponivel: parseInt(quantidade_disponivel) || 1,
        disponivel: (parseInt(quantidade_disponivel) || 1) > 0,
        paginas: paginasPrisma,
        editora: editoraPrisma,
        sinopse: sinopsePrisma,
        capaUrl: capaUrlPrisma,
        localizacao: localizacaoPrisma
    }

    try {
        const novoLivro = await prisma.livro.create({
            data: dataToPrisma,
        });
        
        return res.status(201).json(mapLivroToFrontend(novoLivro));

    } catch (error) {
        return res.status(400).json({ error: 'Erro ao criar livro. Verifique os dados fornecidos.' });
    }
});

// [PUT] /api/livros/:id: Atualizar (CORREÇÃO DE INSERT)
livroRouter.put('/:id', async (req, res) => {
    const { ano_publicacao, quantidade_total, quantidade_disponivel, paginas, editora, sinopse, capa_url, localizacao, ...rest } = req.body;

    const data: any = { ...rest };
    
    if (ano_publicacao !== undefined) data.anoPublicacao = parseInt(ano_publicacao);
    if (quantidade_total !== undefined) data.quantidadeTotal = parseInt(quantidade_total);
    if (quantidade_disponivel !== undefined) {
        data.quantidadeDisponivel = parseInt(quantidade_disponivel);
        data.disponivel = parseInt(quantidade_disponivel) > 0;
    }
    
    if (paginas !== undefined) data.paginas = paginas ? parseInt(paginas) : null;
    if (editora !== undefined) data.editora = editora || null;
    if (sinopse !== undefined) data.sinopse = sinopse || null;
    if (capa_url !== undefined) data.capaUrl = capa_url || null;
    if (localizacao !== undefined) data.localizacao = localizacao || null;

    try {
        const livroAtualizado = await prisma.livro.update({
            where: { id: req.params.id },
            data: data,
        });
        
        return res.json(mapLivroToFrontend(livroAtualizado));

    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Livro não encontrado para atualização.' });
        }
        return res.status(400).json({ error: 'Erro ao atualizar livro. Verifique os dados.' });
    }
});

// ... (DELETE /:id mantido) ...

livroRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.livro.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Livro não encontrado para exclusão.' });
        }
        return res.status(500).json({ error: 'Erro ao deletar livro.' });
    }
});

export default livroRouter;