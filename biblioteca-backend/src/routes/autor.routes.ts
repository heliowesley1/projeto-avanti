import { Router } from 'express';
import type { Autor as AutorPrisma } from '@prisma/client';
import prisma from '../prisma';

const autorRouter = Router();

const mapFrontendToPrisma = (data: any) => {
    const dataToPrisma: any = {};
    
    if (data.nome !== undefined) dataToPrisma.nome = data.nome;
    if (data.nome_artistico !== undefined) dataToPrisma.nomeArtistico = data.nome_artistico || null;
    if (data.biografia !== undefined) dataToPrisma.biografia = data.biografia || null;
    
    if (data.data_nascimento !== undefined) dataToPrisma.dataNascimento = data.data_nascimento ? new Date(data.data_nascimento) : null;
    if (data.data_falecimento !== undefined) dataToPrisma.dataFalecimento = data.data_falecimento ? new Date(data.data_falecimento) : null;
    
    if (data.nacionalidade !== undefined) dataToPrisma.nacionalidade = data.nacionalidade || null;
    if (data.generos_literarios !== undefined) dataToPrisma.generosLiterarios = data.generos_literarios;
    if (data.foto_url !== undefined) dataToPrisma.fotoUrl = data.foto_url || null;
    if (data.site_oficial !== undefined) dataToPrisma.siteOficial = data.site_oficial || null;
    if (data.ativo !== undefined) dataToPrisma.ativo = data.ativo === 'true' || data.ativo === true;
    if (data.total_livros !== undefined) dataToPrisma.totalLivros = parseInt(data.total_livros);
    
    return dataToPrisma;
}

const mapAutorToFrontend = (autor: AutorPrisma) => ({
    _id: autor.id,
    nome: autor.nome,
    nome_artistico: autor.nomeArtistico ?? "", 
    biografia: autor.biografia ?? "",
    data_nascimento: autor.dataNascimento?.toISOString(),
    data_falecimento: autor.dataFalecimento?.toISOString(),
    nacionalidade: autor.nacionalidade ?? "",
    generos_literarios: autor.generosLiterarios, 
    foto_url: autor.fotoUrl ?? "",
    site_oficial: autor.siteOficial ?? "",
    ativo: autor.ativo,
    total_livros: autor.totalLivros ?? 0, 
    createdAt: autor.createdAt.toISOString(),
    updatedAt: autor.updatedAt.toISOString(),
});

autorRouter.get('/', async (req, res) => {
    try {
        const autores = await prisma.autor.findMany({ 
            orderBy: { nome: 'asc' } 
        });
        return res.json(autores.map(mapAutorToFrontend));
    } catch (error) {
         console.error('ERRO CRÍTICO AO LISTAR AUTORES (DB/PRISMA):', error);
         return res.status(500).json({ error: 'Erro ao listar autores. Verifique a conexão com o banco de dados.' });
    }
});

autorRouter.post('/', async (req, res) => {
    try {
        const dataToPrisma = mapFrontendToPrisma(req.body); 
        
        const novoAutor = await prisma.autor.create({
            data: dataToPrisma,
        });
        return res.status(201).json(mapAutorToFrontend(novoAutor));
    } catch (error) {
        return res.status(400).json({ error: 'Erro ao criar autor. Verifique os dados.' });
    }
});

autorRouter.put('/:id', async (req, res) => {
    try {
        const dataToUpdate = mapFrontendToPrisma(req.body);

        const autorAtualizado = await prisma.autor.update({
            where: { id: req.params.id },
            data: dataToUpdate,
        });
        return res.json(mapAutorToFrontend(autorAtualizado));
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Autor não encontrado para atualização.' });
        }
        return res.status(400).json({ error: 'Erro ao atualizar autor.' });
    }
});

autorRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.autor.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Autor não encontrado para exclusão.' });
        }
        return res.status(500).json({ error: 'Erro ao deletar autor.' });
    }
});

export default autorRouter;