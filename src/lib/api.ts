// src/lib/api.ts

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos baseados no seu modelo Prisma (use camelCase)
interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Livro extends BaseEntity {
  titulo: string;
  autor: string;
  isbn: string;
  categoria: string;
  anoPublicacao: number;
  // ... outras propriedades
}

export interface Categoria extends BaseEntity {
  nome: string;
  codigo: string;
  descricao?: string;
  cor?: string;
  ativa: boolean;
  ordem?: number;
  totalLivros?: number;
}

// Helper para CRUD genérico
const createApi = <T extends BaseEntity>(path: string) => ({
  list: async (): Promise<T[]> => {
    const response = await api.get(path);
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

// ... crie as APIs para Autores, Emprestimos, Reservas aqui