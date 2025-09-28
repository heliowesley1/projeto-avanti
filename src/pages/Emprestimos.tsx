import React, { useState, useEffect } from 'react'
import {Calendar, Plus, Search, Filter, Edit, Trash2, CheckCircle, AlertTriangle, X, RefreshCw} from 'lucide-react'
import { emprestimosApi, livrosApi, Emprestimo, Livro } from '../lib/api' 
import toast from 'react-hot-toast'
import { format, addDays, isPast, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Emprestimos: React.FC = () => {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([])
  const [livros, setLivros] = useState<Livro[]>([]) 
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmprestimo, setEditingEmprestimo] = useState<Emprestimo | null>(null)

  const statusOptions = [
    { value: 'ativo', label: 'Ativo', color: 'bg-blue-100 text-blue-800' },
    { value: 'devolvido', label: 'Devolvido', color: 'bg-green-100 text-green-800' },
    { value: 'atrasado', label: 'Atrasado', color: 'bg-red-100 text-red-800' },
    { value: 'renovado', label: 'Renovado', color: 'bg-yellow-100 text-yellow-800' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [emprestimosRes, livrosRes] = await Promise.all([
        emprestimosApi.list(),
        livrosApi.list()
      ])
      
      setEmprestimos(emprestimosRes || [])
      setLivros(livrosRes || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const getLivroTitulo = (livroId: string) => {
    const livro = livros.find(l => l._id === livroId)
    return livro ? `${livro.titulo} - ${livro.autor}` : 'Livro não encontrado'
  }

  const calcularMulta = (dataVencimento: string, dataDevolucao?: string) => {
    const vencimento = new Date(dataVencimento)
    const devolucao = dataDevolucao ? new Date(dataDevolucao) : new Date()
    
    if (devolucao <= vencimento) return 0
    
    const diasAtraso = differenceInDays(devolucao, vencimento)
    return diasAtraso * 2.50
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const dataEmprestimo = new Date(formData.get('data_emprestimo') as string)
    const dataDevolucaoPrevista = addDays(dataEmprestimo, 14)
    
    const emprestimoData: Partial<Emprestimo> = {
      livro_id: formData.get('livro_id') as string,
      usuario_nome: formData.get('usuario_nome') as string,
      usuario_email: formData.get('usuario_email') as string,
      usuario_telefone: formData.get('usuario_telefone') as string,
      data_emprestimo: dataEmprestimo.toISOString(),
      data_devolucao_prevista: dataDevolucaoPrevista.toISOString(),
      status: formData.get('status') as Emprestimo['status'] || 'ativo',
      observacoes: formData.get('observacoes') as string,
      multa: parseFloat(formData.get('multa') as string) || 0,
      renovacoes: parseInt(formData.get('renovacoes') as string) || 0,
    }

    if (emprestimoData.status === 'devolvido') {
      emprestimoData.data_devolucao_real = new Date().toISOString()
      emprestimoData.multa = calcularMulta(editingEmprestimo?.data_devolucao_prevista || emprestimoData.data_devolucao_prevista!, emprestimoData.data_devolucao_real)
    }

    try {
      if (editingEmprestimo) {
        await emprestimosApi.update(editingEmprestimo._id, {
          ...emprestimoData
        })
        toast.success('Empréstimo atualizado com sucesso!')
      } else {
        await emprestimosApi.create(emprestimoData)
        toast.success('Empréstimo criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingEmprestimo(null)
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar empréstimo:', error)
      toast.error('Erro ao salvar empréstimo')
    }
  }

  const handleDelete = async (id: string, usuarioNome: string) => {
    if (confirm(`Tem certeza que deseja excluir o empréstimo de "${usuarioNome}"?`)) {
      try {
        await emprestimosApi.delete(id)
        toast.success('Empréstimo excluído com sucesso!')
        fetchData()
      } catch (error) {
        console.error('Erro ao excluir empréstimo:', error)
        toast.error('Erro ao excluir empréstimo')
      }
    }
  }

  const handleRenovar = async (emprestimo: Emprestimo) => {
    if ((emprestimo.renovacoes || 0) >= 3) {
      toast.error('Limite de renovações atingido (máximo 3)')
      return
    }

    try {
      const novaDataVencimento = addDays(new Date(emprestimo.data_devolucao_prevista), 14)
      
      await emprestimosApi.update(emprestimo._id, {
        data_devolucao_prevista: novaDataVencimento.toISOString(),
        status: 'renovado',
        renovacoes: (emprestimo.renovacoes || 0) + 1
      })
      
      toast.success('Empréstimo renovado com sucesso!')
      fetchData()
    } catch (error) {
      console.error('Erro ao renovar empréstimo:', error)
      toast.error('Erro ao renovar empréstimo')
    }
  }

  const handleDevolver = async (emprestimo: Emprestimo) => {
    try {
      const dataDevolucao = new Date().toISOString()
      const multa = calcularMulta(emprestimo.data_devolucao_prevista, dataDevolucao)
      
      await emprestimosApi.update(emprestimo._id, {
        status: 'devolvido',
        data_devolucao_real: dataDevolucao,
        multa: multa
      })
      
      if (multa > 0) {
        toast.success(`Livro devolvido! Multa: R$ ${multa.toFixed(2)}`)
      } else {
        toast.success('Livro devolvido com sucesso!')
      }
      
      fetchData()
    } catch (error) {
      console.error('Erro ao devolver livro:', error)
      toast.error('Erro ao devolver livro')
    }
  }

  const filteredEmprestimos = emprestimos.filter(emprestimo => {
    const matchesSearch = emprestimo.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emprestimo.usuario_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getLivroTitulo(emprestimo.livro_id).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === '' || emprestimo.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  const isAtrasado = (dataVencimento: string, status: string) => {
    return status !== 'devolvido' && isPast(new Date(dataVencimento))
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
            <Calendar className="mr-3 h-8 w-8 text-blue-600" />
            Gerenciamento de Empréstimos
          </h1>
          <p className="text-gray-600 mt-2">
            Controle de empréstimos, devoluções e renovações
          </p>
        </div>
        <button
          onClick={() => { setEditingEmprestimo(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Empréstimo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por usuário, email ou livro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos os status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Emprestimos List */}
      <div className="space-y-4">
        {filteredEmprestimos.map((emprestimo) => {
          const statusInfo = getStatusInfo(emprestimo.status)
          const atrasado = isAtrasado(emprestimo.data_devolucao_prevista, emprestimo.status)
          
          return (
            <div key={emprestimo._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Informações do Usuário */}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {emprestimo.usuario_nome}
                  </h3>
                  <p className="text-gray-600 text-sm mb-1">{emprestimo.usuario_email}</p>
                  {emprestimo.usuario_telefone && (
                    <p className="text-gray-500 text-sm">{emprestimo.usuario_telefone}</p>
                  )}
                </div>

                {/* Informações do Livro */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Livro:</h4>
                  <p className="text-gray-600 text-sm">{getLivroTitulo(emprestimo.livro_id)}</p>
                </div>

                {/* Datas */}
                <div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Empréstimo:</span>
                      <p className="text-sm text-gray-700">
                        {format(new Date(emprestimo.data_emprestimo), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Vencimento:</span>
                      <p className={`text-sm ${atrasado ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {format(new Date(emprestimo.data_devolucao_prevista), 'dd/MM/yyyy', { locale: ptBR })}
                        {atrasado && <AlertTriangle className="inline ml-1 h-4 w-4" />}
                      </p>
                    </div>
                    {emprestimo.data_devolucao_real && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Devolvido:</span>
                        <p className="text-sm text-gray-700">
                          {format(new Date(emprestimo.data_devolucao_real), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status e Ações */}
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {(emprestimo.renovacoes || 0) > 0 && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {emprestimo.renovacoes} renovação(ões)
                      </span>
                    )}
                  </div>

                  {emprestimo.multa !== undefined && emprestimo.multa > 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      Multa: R$ {emprestimo.multa.toFixed(2)}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {emprestimo.status !== 'devolvido' && (
                      <>
                        <button
                          onClick={() => handleDevolver(emprestimo)}
                          className="bg-green-50 text-green-600 px-3 py-1 rounded text-sm hover:bg-green-100 transition-colors flex items-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Devolver
                        </button>
                        
                        {(emprestimo.renovacoes || 0) < 3 && (
                          <button
                            onClick={() => handleRenovar(emprestimo)}
                            className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded text-sm hover:bg-yellow-100 transition-colors flex items-center"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Renovar
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => { setEditingEmprestimo(emprestimo); setShowForm(true) }}
                      className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100 transition-colors flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    
                    <button
                      onClick={() => handleDelete(emprestimo._id, emprestimo.usuario_nome)}
                      className="bg-red-50 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-100 transition-colors flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </button>
                  </div>

                  {emprestimo.observacoes && (
                    <p className="text-xs text-gray-500 italic">
                      Obs: {emprestimo.observacoes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredEmprestimos.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhum empréstimo encontrado</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingEmprestimo ? 'Editar Empréstimo' : 'Novo Empréstimo'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingEmprestimo(null) }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Livro *
                    </label>
                    <select
                      name="livro_id"
                      defaultValue={editingEmprestimo?.livro_id || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um livro</option>
                      {
                      livros.filter(livro => 
                          livro.disponivel || (editingEmprestimo && livro._id === editingEmprestimo.livro_id)
                      ).map(livro => (
                        <option key={livro._id} value={livro._id}>
                          {livro.titulo} - {livro.autor} {livro.disponivel ? '' : '(Emprestado)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Usuário *
                    </label>
                    <input
                      name="usuario_nome"
                      defaultValue={editingEmprestimo?.usuario_nome || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      name="usuario_email"
                      type="email"
                      defaultValue={editingEmprestimo?.usuario_email || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      name="usuario_telefone"
                      defaultValue={editingEmprestimo?.usuario_telefone || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data do Empréstimo *
                    </label>
                    <input
                      name="data_emprestimo"
                      type="datetime-local"
                      defaultValue={editingEmprestimo ? 
                        format(new Date(editingEmprestimo.data_emprestimo), "yyyy-MM-dd'T'HH:mm") :
                        format(new Date(), "yyyy-MM-dd'T'HH:mm")
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingEmprestimo?.status || 'ativo'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Multa (R$)
                    </label>
                    <input
                      name="multa"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editingEmprestimo?.multa || 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Renovações
                    </label>
                    <input
                      name="renovacoes"
                      type="number"
                      min="0"
                      max="3"
                      defaultValue={editingEmprestimo?.renovacoes || 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    rows={3}
                    defaultValue={editingEmprestimo?.observacoes || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingEmprestimo ? 'Atualizar Empréstimo' : 'Criar Empréstimo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingEmprestimo(null) }}
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

export default Emprestimos