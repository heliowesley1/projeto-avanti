// src/pages/Categorias.tsx (Refatorado para usar a API local)

import React, { useState, useEffect } from 'react'
import {Tag, Plus, Search, Edit, Trash2, X} from 'lucide-react'
import { categoriasApi, Categoria } from '../lib/api' // <--- USANDO A NOVA API LOCAL
import toast from 'react-hot-toast'

// A interface Categoria é importada de '../lib/api'

const Categorias: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)

  const coresPredefinidas = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      // Chamada para a API local (substituindo lumi.entities.categorias.list)
      const response = await categoriasApi.list() 
      setCategorias(response || []) // A API local retorna diretamente o array
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const categoriaData: Partial<Categoria> = {
      nome: formData.get('nome') as string,
      codigo: formData.get('codigo') as string,
      descricao: formData.get('descricao') as string,
      cor: formData.get('cor') as string,
      ativa: formData.get('ativa') === 'true',
      ordem: parseInt(formData.get('ordem') as string) || 1,
      total_livros: parseInt(formData.get('total_livros') as string) || 0, // snake_case
      // creator e datas são manipulados no backend
    }

    try {
      if (editingCategoria) {
        // Chamada para a API local (substituindo lumi.entities.categorias.update)
        await categoriasApi.update(editingCategoria._id, {
          ...categoriaData
        })
        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Chamada para a API local (substituindo lumi.entities.categorias.create)
        await categoriasApi.create(categoriaData)
        toast.success('Categoria criada com sucesso!')
      }
      
      setShowForm(false)
      setEditingCategoria(null)
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      toast.error('Erro ao salvar categoria')
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) {
      try {
        // Chamada para a API local (substituindo lumi.entities.categorias.delete)
        await categoriasApi.delete(id)
        toast.success('Categoria excluída com sucesso!')
        fetchCategorias()
      } catch (error) {
        console.error('Erro ao excluir categoria:', error)
        toast.error('Erro ao excluir categoria')
      }
    }
  }

  const toggleStatus = async (categoria: Categoria) => {
    try {
      // Chamada para a API local (substituindo lumi.entities.categorias.update)
      await categoriasApi.update(categoria._id, {
        ativa: !categoria.ativa
      })
      toast.success(`Categoria ${!categoria.ativa ? 'ativada' : 'desativada'} com sucesso!`)
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao alterar status da categoria:', error)
      toast.error('Erro ao alterar status da categoria')
    }
  }

  const filteredCategorias = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoria.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (categoria.descricao && categoria.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
            <Tag className="mr-3 h-8 w-8 text-blue-600" />
            Gerenciamento de Categorias
          </h1>
          <p className="text-gray-600 mt-2">
            Organize o acervo por categorias e gêneros literários
          </p>
        </div>
        <button
          onClick={() => { setEditingCategoria(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Adicionar Categoria</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar categorias por nome, código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategorias.map((categoria) => (
          <div key={categoria._id} className="bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: categoria.cor || '#6B7280' }}
                  ></div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{categoria.nome}</h3>
                    <p className="text-sm text-gray-500">Código: {categoria.codigo}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleStatus(categoria)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    categoria.ativa 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {categoria.ativa ? 'Ativa' : 'Inativa'}
                </button>
              </div>
              
              {categoria.descricao && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {categoria.descricao}
                </p>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{categoria.total_livros || 0}</p>
                  <p className="text-xs text-gray-500">Livros</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-700">{categoria.ordem || 1}</p>
                  <p className="text-xs text-gray-500">Ordem</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => { setEditingCategoria(categoria); setShowForm(true) }}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(categoria._id, categoria.nome)}
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

      {filteredCategorias.length === 0 && (
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma categoria encontrada</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCategoria ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingCategoria(null) }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Categoria *
                    </label>
                    <input
                      name="nome"
                      defaultValue={editingCategoria?.nome || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      name="codigo"
                      defaultValue={editingCategoria?.codigo || ''}
                      required
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cor da Categoria
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        name="cor"
                        type="color"
                        defaultValue={editingCategoria?.cor || '#3B82F6'}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-1">
                        {coresPredefinidas.map((cor, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              const colorInput = document.querySelector('input[name="cor"]') as HTMLInputElement
                              if (colorInput) colorInput.value = cor
                            }}
                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordem de Exibição
                    </label>
                    <input
                      name="ordem"
                      type="number"
                      min="1"
                      defaultValue={editingCategoria?.ordem || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total de Livros
                    </label>
                    <input
                      name="total_livros"
                      type="number"
                      min="0"
                      defaultValue={editingCategoria?.total_livros || 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="ativa"
                      defaultValue={editingCategoria?.ativa?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Ativa</option>
                      <option value="false">Inativa</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="descricao"
                    rows={3}
                    defaultValue={editingCategoria?.descricao || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva o tipo de livros desta categoria..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingCategoria ? 'Atualizar Categoria' : 'Criar Categoria'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingCategoria(null) }}
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
    </div>
  )
}

export default Categorias