import { Router } from 'express';
import type { Emprestimo as EmprestimoPrisma } from '@prisma/client';
import prisma from '../prisma';

const emprestimoRouter = Router();

const mapEmprestimoToFrontend = (emprestimo: EmprestimoPrisma) => ({
    _id: emprestimo.id,
    livro_id: emprestimo.livroId, 
    usuario_nome: emprestimo.usuarioNome,
    usuario_email: emprestimo.usuarioEmail,
    usuario_telefone: emprestimo.usuarioTelefone ?? "", 
    data_emprestimo: emprestimo.dataEmprestimo.toISOString(), 
    data_devolucao_prevista: emprestimo.dataDevolucaoPrevista.toISOString(), 
    data_devolucao_real: emprestimo.dataDevolucaoReal?.toISOString(), 
    status: emprestimo.status,
    observacoes: emprestimo.observacoes ?? "", 
    multa: emprestimo.multa ?? 0, 
    renovacoes: emprestimo.renovacoes ?? 0, 
    createdAt: emprestimo.createdAt.toISOString(),
    updatedAt: emprestimo.updatedAt.toISOString(),
});

const mapFrontendToPrisma = (data: any) => {
    const dataToPrisma: any = {};
    
    if (data.livro_id !== undefined) dataToPrisma.livroId = data.livro_id;
    if (data.usuario_nome !== undefined) dataToPrisma.usuarioNome = data.usuario_nome;
    if (data.usuario_email !== undefined) dataToPrisma.usuarioEmail = data.usuario_email;
    if (data.usuario_telefone !== undefined) dataToPrisma.usuarioTelefone = data.usuario_telefone || null;
    
    if (data.data_emprestimo !== undefined) dataToPrisma.dataEmprestimo = new Date(data.data_emprestimo);
    if (data.data_devolucao_prevista !== undefined) dataToPrisma.dataDevolucaoPrevista = new Date(data.data_devolucao_prevista);
    if (data.data_devolucao_real !== undefined) dataToPrisma.dataDevolucaoReal = data.data_devolucao_real ? new Date(data.data_devolucao_real) : null;
    
    if (data.status !== undefined) dataToPrisma.status = data.status;
    if (data.observacoes !== undefined) dataToPrisma.observacoes = data.observacoes || null;
    if (data.multa !== undefined) dataToPrisma.multa = parseFloat(data.multa);
    if (data.renovacoes !== undefined) dataToPrisma.renovacoes = parseInt(data.renovacoes);
    
    return dataToPrisma;
}

emprestimoRouter.get('/', async (req, res) => {
    try {
        const emprestimos = await prisma.emprestimo.findMany({ 
            orderBy: { createdAt: 'desc' } 
        });
        return res.json(emprestimos.map(mapEmprestimoToFrontend));
    } catch (error) {
         console.error('ERRO CRÍTICO AO LISTAR EMPRÉSTIMOS (DB/PRISMA):', error);
         return res.status(500).json({ error: 'Erro ao listar empréstimos. Verifique a conexão com o banco de dados.' });
    }
});

emprestimoRouter.post('/', async (req, res) => {
    try {
        const dataToPrisma = mapFrontendToPrisma(req.body);
        
        const novoRegistro = await prisma.emprestimo.create({ 
            data: dataToPrisma,
        });
        return res.status(201).json(mapEmprestimoToFrontend(novoRegistro));
    } catch (error) {
        return res.status(400).json({ error: 'Erro ao criar empréstimo. Verifique os dados.' });
    }
});

emprestimoRouter.put('/:id', async (req, res) => {
    try {
        const dataToUpdate = mapFrontendToPrisma(req.body);

        const emprestimoAtualizado = await prisma.emprestimo.update({
            where: { id: req.params.id },
            data: dataToUpdate,
        });
        return res.json(mapEmprestimoToFrontend(emprestimoAtualizado));
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Empréstimo não encontrado para atualização.' });
        }
        return res.status(400).json({ error: 'Erro ao atualizar empréstimo.' });
    }
});

emprestimoRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.emprestimo.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Empréstimo não encontrado para exclusão.' });
        }
        return res.status(500).json({ error: 'Erro ao deletar empréstimo.' });
    }
});

export default emprestimoRouter;