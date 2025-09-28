import React, { useState, useEffect } from 'react'
import {Users, Plus, Search, Edit, Trash2, Eye, X, Calendar, Globe, BookOpen} from 'lucide-react'
import { autoresApi, Autor } from '../lib/api' 
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Autores: React.FC = () => {
  const [autores, setAutores] = useState<Autor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAutor, setEditingAutor] = useState<Autor | null>(null)
  const [viewingAutor, setViewingAutor] = useState<Autor | null>(null)

  const generosLiterarios = [
    'Ficção', 'Romance', 'Fantasia', 'Mistério', 'Terror', 'Suspense',
    'Drama', 'Comédia', 'Biografia', 'História', 'Ciência', 'Filosofia',
    'Poesia', 'Crônica', 'Ensaio', 'Infantil', 'Juvenil', 'Autoajuda'
  ]

  useEffect(() => {
    fetchAutores()
  }, [])

  const fetchAutores = async () => {
    try {
      setLoading(true)
      const response = await autoresApi.list() 
      setAutores(response || []) 
    } catch (error) {
      console.error('Erro ao carregar autores:', error)
      toast.error('Erro ao carregar autores')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const generosSelecionados = generosLiterarios.filter(genero => 
      formData.get(`genero_${genero}`) === 'on'
    )
    
    const autorData: Partial<Autor> = {
      nome: formData.get('nome') as string,
      nome_artistico: formData.get('nome_artistico') as string,
      biografia: formData.get('biografia') as string,
      data_nascimento: formData.get('data_nascimento') ? 
        new Date(formData.get('data_nascimento') as string).toISOString() : undefined,
      data_falecimento: formData.get('data_falecimento') ? 
        new Date(formData.get('data_falecimento') as string).toISOString() : undefined,
      nacionalidade: formData.get('nacionalidade') as string,
      generos_literarios: generosSelecionados,
      foto_url: formData.get('foto_url') as string,
      site_oficial: formData.get('site_oficial') as string,
      ativo: formData.get('ativo') === 'true',
      total_livros: parseInt(formData.get('total_livros') as string) || 0,
    }

    try {
      if (editingAutor) {
        await autoresApi.update(editingAutor._id, {
          ...autorData
        })
        toast.success('Autor atualizado com sucesso!')
      } else {
        await autoresApi.create(autorData)
        toast.success('Autor criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingAutor(null)
      fetchAutores()
    } catch (error) {
      console.error('Erro ao salvar autor:', error)
      toast.error('Erro ao salvar autor')
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o autor "${nome}"?`)) {
      try {
        await autoresApi.delete(id)
        toast.success('Autor excluído com sucesso!')
        fetchAutores()
      } catch (error) {
        console.error('Erro ao excluir autor:', error)
        toast.error('Erro ao excluir autor')
      }
    }
  }

  const toggleStatus = async (autor: Autor) => {
    try {
      await autoresApi.update(autor._id, {
        ativo: !autor.ativo
      })
      toast.success(`Autor ${!autor.ativo ? 'ativado' : 'desativado'} com sucesso!`)
      fetchAutores()
    } catch (error) {
      console.error('Erro ao alterar status do autor:', error)
      toast.error('Erro ao alterar status do autor')
    }
  }

  const filteredAutores = autores.filter(autor =>
    autor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (autor.nome_artistico && autor.nome_artistico.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (autor.nacionalidade && autor.nacionalidade.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const calcularIdade = (dataNascimento?: string, dataFalecimento?: string) => {
    if (!dataNascimento) return null
    
    const nascimento = new Date(dataNascimento)
    const referencia = dataFalecimento ? new Date(dataFalecimento) : new Date()
    
    let idade = referencia.getFullYear() - nascimento.getFullYear()
    const mesAtual = referencia.getMonth()
    const mesNascimento = nascimento.getMonth()
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && referencia.getDate() < nascimento.getDate())) {
      idade--
    }
    
    return idade
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
            <Users className="mr-3 h-8 w-8 text-blue-600" />
            Gerenciamento de Autores
          </h1>
          <p className="text-gray-600 mt-2">
            Cadastro e informações dos escritores do acervo
          </p>
        </div>
        <button
          onClick={() => { setEditingAutor(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Adicionar Autor</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nome, pseudônimo ou nacionalidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAutores.map((autor) => {
          const idade = calcularIdade(autor.data_nascimento, autor.data_falecimento)
          
          return (
            <div key={autor._id} className="bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={autor.foto_url || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg'}
                    alt={autor.nome}
                    className="w-16 h-16 rounded-full object-cover border border-gray-300"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{autor.nome}</h3>
                        {autor.nome_artistico && autor.nome_artistico !== autor.nome && (
                          <p className="text-sm text-gray-600 italic">"{autor.nome_artistico}"</p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => toggleStatus(autor)}
                        className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                          autor.ativo 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {autor.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                    
                    {autor.nacionalidade && (
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Globe className="h-3 w-3 mr-1" />
                        {autor.nacionalidade}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Informações de Data */}
                <div className="space-y-1 mb-4">
                  {autor.data_nascimento && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Nasceu em {format(new Date(autor.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                      {idade && ` (${idade} anos${autor.data_falecimento ? ' ao falecer' : ''})`}
                    </p>
                  )}
                  {autor.data_falecimento && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Faleceu em {format(new Date(autor.data_falecimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                </div>
                
                {/* Gêneros Literários */}
                {autor.generos_literarios && autor.generos_literarios.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {autor.generos_literarios.slice(0, 3).map((genero, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {genero}
                        </span>
                      ))}
                      {autor.generos_literarios.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{autor.generos_literarios.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Estatísticas */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{autor.total_livros || 0}</p>
                    <p className="text-xs text-gray-500">Livros</p>
                  </div>
                  {autor.site_oficial && (
                    <a
                      href={autor.site_oficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
                
                {/* Biografia Preview */}
                {autor.biografia && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {autor.biografia}
                  </p>
                )}
                
                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingAutor(autor)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-100 transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </button>
                  <button
                    onClick={() => { setEditingAutor(autor); setShowForm(true) }}
                    className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 rounded text-sm hover:bg-yellow-100 transition-colors flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(autor._id, autor.nome)}
                    className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded text-sm hover:bg-red-100 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredAutores.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhum autor encontrado</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAutor ? 'Editar Autor' : 'Adicionar Novo Autor'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingAutor(null) }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      name="nome"
                      defaultValue={editingAutor?.nome || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Artístico / Pseudônimo
                    </label>
                    <input
                      name="nome_artistico"
                      defaultValue={editingAutor?.nome_artistico || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nacionalidade
                    </label>
                    <input
                      name="nacionalidade"
                      defaultValue={editingAutor?.nacionalidade || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="ativo"
                      defaultValue={editingAutor?.ativo?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      name="data_nascimento"
                      type="date"
                      defaultValue={editingAutor?.data_nascimento ? 
                        format(new Date(editingAutor.data_nascimento), 'yyyy-MM-dd') : ''
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Falecimento
                    </label>
                    <input
                      name="data_falecimento"
                      type="date"
                      defaultValue={editingAutor?.data_falecimento ? 
                        format(new Date(editingAutor.data_falecimento), 'yyyy-MM-dd') : ''
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL da Foto
                    </label>
                    <input
                      name="foto_url"
                      type="url"
                      defaultValue={editingAutor?.foto_url || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site Oficial
                    </label>
                    <input
                      name="site_oficial"
                      type="url"
                      defaultValue={editingAutor?.site_oficial || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total de Livros no Acervo
                    </label>
                    <input
                      name="total_livros"
                      type="number"
                      min="0"
                      defaultValue={editingAutor?.total_livros || 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Biografia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biografia
                  </label>
                  <textarea
                    name="biografia"
                    rows={4}
                    defaultValue={editingAutor?.biografia || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Escreva uma breve biografia do autor..."
                  />
                </div>
                
                {/* Gêneros Literários */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Gêneros Literários
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {generosLiterarios.map((genero) => (
                      <label key={genero} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name={`genero_${genero}`}
                          defaultChecked={editingAutor?.generos_literarios?.includes(genero) || false}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{genero}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingAutor ? 'Atualizar Autor' : 'Criar Autor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingAutor(null) }}
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
      {viewingAutor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Perfil do Autor</h2>
                <button
                  onClick={() => setViewingAutor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Header com foto e info básica */}
                <div className="flex items-start space-x-6">
                  <img
                    src={viewingAutor.foto_url || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg'}
                    alt={viewingAutor.nome}
                    className="w-32 h-32 rounded-lg object-cover border border-gray-300"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{viewingAutor.nome}</h3>
                    {viewingAutor.nome_artistico && viewingAutor.nome_artistico !== viewingAutor.nome && (
                      <p className="text-lg text-gray-600 italic mb-2">"{viewingAutor.nome_artistico}"</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {viewingAutor.nacionalidade && (
                        <div>
                          <span className="font-medium text-gray-700">Nacionalidade:</span>
                          <p className="text-gray-600">{viewingAutor.nacionalidade}</p>
                        </div>
                      )}
                      
                      {viewingAutor.data_nascimento && (
                        <div>
                          <span className="font-medium text-gray-700">Nascimento:</span>
                          <p className="text-gray-600">
                            {format(new Date(viewingAutor.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                            {calcularIdade(viewingAutor.data_nascimento, viewingAutor.data_falecimento) && 
                              ` (${calcularIdade(viewingAutor.data_nascimento, viewingAutor.data_falecimento)} anos${viewingAutor.data_falecimento ? ' ao falecer' : ''})`
                            }
                          </p>
                        </div>
                      )}
                      
                      {viewingAutor.data_falecimento && (
                        <div>
                          <span className="font-medium text-gray-700">Falecimento:</span>
                          <p className="text-gray-600">
                            {format(new Date(viewingAutor.data_falecimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-700">Livros no Acervo:</span>
                        <p className="text-gray-600 flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {viewingAutor.total_livros || 0}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                          viewingAutor.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {viewingAutor.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      {viewingAutor.site_oficial && (
                        <div>
                          <span className="font-medium text-gray-700">Site Oficial:</span>
                          <a 
                            href={viewingAutor.site_oficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 ml-2"
                          >
                            <Globe className="h-4 w-4 inline" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Gêneros Literários */}
                {viewingAutor.generos_literarios && viewingAutor.generos_literarios.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Gêneros Literários:</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingAutor.generos_literarios.map((genero, index) => (
                        <span key={index} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                          {genero}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Biografia */}
                {viewingAutor.biografia && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Biografia:</h4>
                    <p className="text-gray-600 leading-relaxed">{viewingAutor.biografia}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Autores