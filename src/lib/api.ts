// src/lib/api.ts - API WRAPPER CORRETO PARA O FRONTEND (Usa Axios e Proxy)

import axios from 'axios';

// URL base deve ser a URL relativa que o proxy do Vite irá interceptar
const API_BASE_URL = '/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interface Base para todas as entidades (mantida)
interface BaseEntity {
  _id: string; // Mapeado de 'id' do Prisma
  createdAt: string;
  updatedAt: string;
}

// Interfaces de Entidades (mantidas)
export interface Livro extends BaseEntity {
  titulo: string;
  autor: string;
  isbn: string;
  categoria: string;
  ano_publicacao: number;
  editora?: string;
  paginas?: number;
  sinopse?: string;
  capa_url?: string;
  disponivel: boolean;
  quantidade_total?: number;
  quantidade_disponivel?: number;
  localizacao?: string;
}
// ... (outras interfaces Categoria, Emprestimo, Reserva, Autor)

export interface Categoria extends BaseEntity {
  nome: string;
  codigo: string;
  descricao?: string;
  cor?: string;
  ativa: boolean;
  ordem?: number;
  total_livros?: number;
}

export interface Emprestimo extends BaseEntity {
  livro_id: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_telefone?: string;
  data_emprestimo: string;
  data_devolucao_prevista: string;
  data_devolucao_real?: string;
  status: 'ativo' | 'devolvido' | 'atrasado' | 'renovado';
  observacoes?: string;
  multa?: number;
  renovacoes?: number;
}

export interface Reserva extends BaseEntity {
  livro_id: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_telefone?: string;
  data_reserva: string;
  data_expiracao?: string;
  data_notificacao?: string;
  status: 'ativa' | 'notificada' | 'expirada' | 'cancelada' | 'atendida';
  prioridade?: number;
  observacoes?: string;
}

export interface Autor extends BaseEntity {
    nome: string
    nome_artistico?: string
    biografia?: string
    data_nascimento?: string
    data_falecimento?: string
    nacionalidade?: string
    generos_literarios?: string[]
    foto_url?: string
    site_oficial?: string
    ativo: boolean
    total_livros?: number
}


// Helper para CRUD genérico (mantido)
const createApi = <T extends BaseEntity>(path: string) => ({
  list: async (params?: any): Promise<T[]> => {
    const response = await api.get(path, { params });
    return response.data;
  },
  getById: async (id: string): Promise<T> => {
    const response = await api.get(`${path}/${id}`);
    return response.data;
  },
  create: async (data: any): Promise<T> => {
    const response = await api.post(path, data);
    return response.data;
  },
  update: async (id: string, data: any): Promise<T> => {
    const response = await api.put(`${path}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${path}/${id}`);
  },
});

export const livrosApi = createApi<Livro>('/livros');
export const categoriasApi = createApi<Categoria>('/categorias');
export const emprestimosApi = createApi<Emprestimo>('/emprestimos');
export const reservasApi = createApi<Reserva>('/reservas');
export const autoresApi = createApi<Autor>('/autores');