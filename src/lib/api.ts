import axios from 'axios';

const API_BASE_URL = '/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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