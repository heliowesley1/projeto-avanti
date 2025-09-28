import { Router } from 'express';
import type { Reserva as ReservaPrisma } from '@prisma/client';
import prisma from '../prisma';

const reservaRouter = Router();

const mapFrontendToPrisma = (data: any) => {
    const dataToPrisma: any = {};
    
    if (data.livro_id !== undefined) dataToPrisma.livroId = data.livro_id;
    if (data.usuario_nome !== undefined) dataToPrisma.usuarioNome = data.usuario_nome;
    if (data.usuario_email !== undefined) dataToPrisma.usuarioEmail = data.usuario_email;
    if (data.usuario_telefone !== undefined) dataToPrisma.usuarioTelefone = data.usuario_telefone || null;
    
    if (data.data_reserva !== undefined) dataToPrisma.dataReserva = new Date(data.data_reserva);
    if (data.data_expiracao !== undefined) dataToPrisma.dataExpiracao = data.data_expiracao ? new Date(data.data_expiracao) : null;
    if (data.data_notificacao !== undefined) dataToPrisma.dataNotificacao = data.data_notificacao ? new Date(data.data_notificacao) : null;
    
    if (data.status !== undefined) dataToPrisma.status = data.status;
    if (data.prioridade !== undefined) dataToPrisma.prioridade = parseInt(data.prioridade);
    if (data.observacoes !== undefined) dataToPrisma.observacoes = data.observacoes || null;
    
    return dataToPrisma;
}

const mapReservaToFrontend = (reserva: ReservaPrisma) => ({
    _id: reserva.id,
    livro_id: reserva.livroId,
    usuario_nome: reserva.usuarioNome,
    usuario_email: reserva.usuarioEmail,
    usuario_telefone: reserva.usuarioTelefone ?? "", 
    data_reserva: reserva.dataReserva.toISOString(),
    data_expiracao: reserva.dataExpiracao?.toISOString(),
    data_notificacao: reserva.dataNotificacao?.toISOString(),
    status: reserva.status,
    prioridade: reserva.prioridade ?? 1, 
    observacoes: reserva.observacoes ?? "", 
    createdAt: reserva.createdAt.toISOString(),
    updatedAt: reserva.updatedAt.toISOString(),
});

reservaRouter.get('/', async (req, res) => {
    try {
        const reservas = await prisma.reserva.findMany({ 
            orderBy: { createdAt: 'asc' } 
        });
        return res.json(reservas.map(mapReservaToFrontend));
    } catch (error) {
         console.error('ERRO CRÍTICO AO LISTAR RESERVAS (DB/PRISMA):', error);
         return res.status(500).json({ error: 'Erro ao listar reservas. Verifique a conexão com o banco de dados.' });
    }
});

reservaRouter.post('/', async (req, res) => {
    try {
        const dataToPrisma = mapFrontendToPrisma(req.body); 
        
        const novaReserva = await prisma.reserva.create({
            data: dataToPrisma,
        });
        return res.status(201).json(mapReservaToFrontend(novaReserva));
    } catch (error) {
        return res.status(400).json({ error: 'Erro ao criar reserva. Verifique os dados.' });
    }
});

reservaRouter.put('/:id', async (req, res) => {
    try {
        const dataToUpdate = mapFrontendToPrisma(req.body); 

        const reservaAtualizada = await prisma.reserva.update({
            where: { id: req.params.id },
            data: dataToUpdate,
        });
        return res.json(mapReservaToFrontend(reservaAtualizada));
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Reserva não encontrada para atualização.' });
        }
        return res.status(400).json({ error: 'Erro ao atualizar reserva.' });
    }
});

reservaRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.reserva.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Reserva não encontrada para exclusão.' });
        }
        return res.status(500).json({ error: 'Erro ao deletar reserva.' });
    }
});

export default reservaRouter;