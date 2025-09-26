
import React, { useState, useEffect } from 'react'
import {BookOpen, Plus, Search, Filter, Edit, Trash2, Eye, X} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Livro {
  _id: string
  titulo: string
  autor: string
  isbn: string
  categoria: string
  ano_publicacao: number
  editora?: string
  paginas?: number
  sinopse?: string
  capa_url?: string
  disponivel: boolean
  quantidade_total?: number
  quantidade_disponivel?: number
  localizacao?: string
  createdAt: string
  updatedAt: string
}

const Livros: React.FC = () => {
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingLivro, setEditingLivro] = useState<Livro | null>(null)
  const [viewingLivro, setViewingLivro] = useState<Livro | null>(null)

  const categorias = [
    'ficcao', 'nao_ficcao', 'romance', 'misterio', 'fantasia', 
    'ciencia', 'historia', 'biografia', 'tecnologia', 'educacao'
  ]

  useEffect(() => {
    fetchLivros()
  }, [])

  const fetchLivros = async () => {
    try {
      setLoading(true)
      const response = await lumi.entities.livros.list({
        sort: { createdAt: -1 }
      })
      setLivros(response.list || [])
    } catch (error) {
      console.error('Erro ao carregar livros:', error)
      toast.error('Erro ao carregar livros')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const livroData = {
      titulo: formData.get('titulo') as string,
      autor: formData.get('autor') as string,
      isbn: formData.get('isbn') as string,
      categoria: formData.get('categoria') as string,
      ano_publicacao: parseInt(formData.get('ano_publicacao') as string),
      editora: formData.get('editora') as string,
      paginas: parseInt(formData.get('paginas') as string) || undefined,
      sinopse: formData.get('sinopse') as string,
      capa_url: formData.get('capa_url') as string,
      disponivel: formData.get('disponivel') === 'true',
      quantidade_total: parseInt(formData.get('quantidade_total') as string) || 1,
      quantidade_disponivel: parseInt(formData.get('quantidade_disponivel') as string) || 1,
      localizacao: formData.get('localizacao') as string,
      creator: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      if (editingLivro) {
        await lumi.entities.livros.update(editingLivro._id, {
          ...livroData,
          updatedAt: new Date().toISOString()
        })
        toast.success('Livro atualizado com sucesso!')
      } else {
        await lumi.entities.livros.create(livroData)
        toast.success('Livro criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingLivro(null)
      fetchLivros()
    } catch (error) {
      console.error('Erro ao salvar livro:', error)
      toast.error('Erro ao salvar livro')
    }
  }

  const handleDelete = async (id: string, titulo: string) => {
    if (confirm(`Tem certeza que deseja excluir o livro "${titulo}"?`)) {
      try {
        await lumi.entities.livros.delete(id)
        toast.success('Livro excluído com sucesso!')
        fetchLivros()
      } catch (error) {
        console.error('Erro ao excluir livro:', error)
        toast.error('Erro ao excluir livro')
      }
    }
  }

  const filteredLivros = livros.filter(livro => {
    const matchesSearch = livro.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         livro.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         livro.isbn.includes(searchTerm)
    const matchesCategory = selectedCategory === '' || livro.categoria === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'ficcao': 'Ficção',
      'nao_ficcao': 'Não Ficção',
      'romance': 'Romance',
      'misterio': 'Mistério',
      'fantasia': 'Fantasia',
      'ciencia': 'Ciência',
      'historia': 'História',
      'biografia': 'Biografia',
      'tecnologia': 'Tecnologia',
      'educacao': 'Educação'
    }
    return labels[categoria] || categoria
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="mr-3 h-8 w-8 text-blue-600" />
            Gerenciamento de Livros
          </h1>
          <p className="text-gray-600 mt-2">
            Controle completo do acervo da biblioteca
          </p>
        </div>
        <button
          onClick={() => { setEditingLivro(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Adicionar Livro</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por título, autor ou ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {getCategoryLabel(categoria)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLivros.map((livro) => (
          <div key={livro._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={livro.capa_url || 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg'}
                alt={livro.titulo}
                className="w-full h-48 object-cover"
              />
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                  {livro.titulo}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  livro.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {livro.disponivel ? 'Disponível' : 'Indisponível'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">por {livro.autor}</p>
              <p className="text-gray-500 text-xs mb-2">
                {getCategoryLabel(livro.categoria)} • {livro.ano_publicacao}
              </p>
              <p className="text-gray-500 text-xs mb-4">ISBN: {livro.isbn}</p>
              
              {livro.quantidade_total && (
                <p className="text-sm text-gray-600 mb-4">
                  Exemplares: {livro.quantidade_disponivel || 0}/{livro.quantidade_total}
                </p>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingLivro(livro)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </button>
                <button
                  onClick={() => { setEditingLivro(livro); setShowForm(true) }}
                  className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 rounded text-sm hover:bg-yellow-100 transition-colors flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(livro._id, livro.titulo)}
                  className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded text-sm hover:bg-red-100 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLivros.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhum livro encontrado</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingLivro ? 'Editar Livro' : 'Adicionar Novo Livro'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingLivro(null) }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <input
                      name="titulo"
                      defaultValue={editingLivro?.titulo || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Autor *
                    </label>
                    <input
                      name="autor"
                      defaultValue={editingLivro?.autor || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ISBN *
                    </label>
                    <input
                      name="isbn"
                      defaultValue={editingLivro?.isbn || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      name="categoria"
                      defaultValue={editingLivro?.categoria || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map(categoria => (
                        <option key={categoria} value={categoria}>
                          {getCategoryLabel(categoria)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ano de Publicação *
                    </label>
                    <input
                      name="ano_publicacao"
                      type="number"
                      min="1000"
                      max="2025"
                      defaultValue={editingLivro?.ano_publicacao || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Editora
                    </label>
                    <input
                      name="editora"
                      defaultValue={editingLivro?.editora || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Páginas
                    </label>
                    <input
                      name="paginas"
                      type="number"
                      min="1"
                      defaultValue={editingLivro?.paginas || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localização
                    </label>
                    <input
                      name="localizacao"
                      defaultValue={editingLivro?.localizacao || ''}
                      placeholder="Ex: Estante A-12"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade Total
                    </label>
                    <input
                      name="quantidade_total"
                      type="number"
                      min="1"
                      defaultValue={editingLivro?.quantidade_total || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade Disponível
                    </label>
                    <input
                      name="quantidade_disponivel"
                      type="number"
                      min="0"
                      defaultValue={editingLivro?.quantidade_disponivel || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL da Capa
                    </label>
                    <input
                      name="capa_url"
                      type="url"
                      defaultValue={editingLivro?.capa_url || ''}
                      placeholder="https://exemplo.com/capa.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="disponivel"
                      defaultValue={editingLivro?.disponivel?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Disponível</option>
                      <option value="false">Indisponível</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sinopse
                  </label>
                  <textarea
                    name="sinopse"
                    rows={4}
                    defaultValue={editingLivro?.sinopse || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingLivro ? 'Atualizar Livro' : 'Criar Livro'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingLivro(null) }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingLivro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes do Livro</h2>
                <button
                  onClick={() => setViewingLivro(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={viewingLivro.capa_url || 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg'}
                    alt={viewingLivro.titulo}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{viewingLivro.titulo}</h3>
                    <p className="text-gray-600">por {viewingLivro.autor}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">ISBN:</span>
                      <p className="text-gray-600">{viewingLivro.isbn}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Categoria:</span>
                      <p className="text-gray-600">{getCategoryLabel(viewingLivro.categoria)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Ano:</span>
                      <p className="text-gray-600">{viewingLivro.ano_publicacao}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Editora:</span>
                      <p className="text-gray-600">{viewingLivro.editora || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Páginas:</span>
                      <p className="text-gray-600">{viewingLivro.paginas || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Localização:</span>
                      <p className="text-gray-600">{viewingLivro.localizacao || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Exemplares:</span>
                      <p className="text-gray-600">
                        {viewingLivro.quantidade_disponivel || 0}/{viewingLivro.quantidade_total || 1}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        viewingLivro.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingLivro.disponivel ? 'Disponível' : 'Indisponível'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {viewingLivro.sinopse && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-2">Sinopse:</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{viewingLivro.sinopse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Livros
