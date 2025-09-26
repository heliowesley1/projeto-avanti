
import React, { useState, useEffect } from 'react'
import {Bookmark, Plus, Search, Filter, Edit, Trash2, Clock, Bell, CheckCircle, XCircle, X, Users} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import { format, addDays, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Reserva {
  _id: string
  livro_id: string
  usuario_nome: string
  usuario_email: string
  usuario_telefone?: string
  data_reserva: string
  data_expiracao?: string
  data_notificacao?: string
  status: 'ativa' | 'notificada' | 'expirada' | 'cancelada' | 'atendida'
  prioridade?: number
  observacoes?: string
  createdAt: string
  updatedAt: string
}

interface Livro {
  _id: string
  titulo: string
  autor: string
  disponivel: boolean
}

const Reservas: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null)

  const statusOptions = [
    { value: 'ativa', label: 'Ativa', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'notificada', label: 'Notificada', color: 'bg-yellow-100 text-yellow-800', icon: Bell },
    { value: 'expirada', label: 'Expirada', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: 'cancelada', label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    { value: 'atendida', label: 'Atendida', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [reservasRes, livrosRes] = await Promise.all([
        lumi.entities.reservas.list({ sort: { prioridade: 1, createdAt: 1 } }),
        lumi.entities.livros.list()
      ])
      
      setReservas(reservasRes.list || [])
      setLivros(livrosRes.list || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const getLivroInfo = (livroId: string) => {
    const livro = livros.find(l => l._id === livroId)
    return livro || { titulo: 'Livro não encontrado', autor: '', disponivel: false }
  }

  const getProximaPrioridade = (livroId: string) => {
    const reservasDoLivro = reservas.filter(r => r.livro_id === livroId && r.status === 'ativa')
    return reservasDoLivro.length > 0 ? Math.max(...reservasDoLivro.map(r => r.prioridade || 1)) + 1 : 1
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const livroId = formData.get('livro_id') as string
    const dataReserva = new Date(formData.get('data_reserva') as string)
    const dataExpiracao = addDays(dataReserva, 7) // 7 dias para retirar após notificação
    
    const reservaData = {
      livro_id: livroId,
      usuario_nome: formData.get('usuario_nome') as string,
      usuario_email: formData.get('usuario_email') as string,
      usuario_telefone: formData.get('usuario_telefone') as string,
      data_reserva: dataReserva.toISOString(),
      data_expiracao: dataExpiracao.toISOString(),
      status: formData.get('status') as string || 'ativa',
      prioridade: parseInt(formData.get('prioridade') as string) || getProximaPrioridade(livroId),
      observacoes: formData.get('observacoes') as string,
      creator: 'bibliotecario',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      if (editingReserva) {
        await lumi.entities.reservas.update(editingReserva._id, {
          ...reservaData,
          updatedAt: new Date().toISOString()
        })
        toast.success('Reserva atualizada com sucesso!')
      } else {
        await lumi.entities.reservas.create(reservaData)
        toast.success('Reserva criada com sucesso!')
      }
      
      setShowForm(false)
      setEditingReserva(null)
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar reserva:', error)
      toast.error('Erro ao salvar reserva')
    }
  }

  const handleDelete = async (id: string, usuarioNome: string) => {
    if (confirm(`Tem certeza que deseja excluir a reserva de "${usuarioNome}"?`)) {
      try {
        await lumi.entities.reservas.delete(id)
        toast.success('Reserva excluída com sucesso!')
        fetchData()
      } catch (error) {
        console.error('Erro ao excluir reserva:', error)
        toast.error('Erro ao excluir reserva')
      }
    }
  }

  const handleNotificar = async (reserva: Reserva) => {
    try {
      await lumi.entities.reservas.update(reserva._id, {
        status: 'notificada',
        data_notificacao: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      toast.success(`${reserva.usuario_nome} foi notificado sobre a disponibilidade!`)
      fetchData()
    } catch (error) {
      console.error('Erro ao notificar usuário:', error)
      toast.error('Erro ao notificar usuário')
    }
  }

  const handleAtender = async (reserva: Reserva) => {
    try {
      await lumi.entities.reservas.update(reserva._id, {
        status: 'atendida',
        updatedAt: new Date().toISOString()
      })
      
      toast.success('Reserva atendida com sucesso!')
      fetchData()
    } catch (error) {
      console.error('Erro ao atender reserva:', error)
      toast.error('Erro ao atender reserva')
    }
  }

  const handleCancelar = async (reserva: Reserva) => {
    if (confirm(`Tem certeza que deseja cancelar a reserva de "${reserva.usuario_nome}"?`)) {
      try {
        await lumi.entities.reservas.update(reserva._id, {
          status: 'cancelada',
          updatedAt: new Date().toISOString()
        })
        
        toast.success('Reserva cancelada com sucesso!')
        fetchData()
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error)
        toast.error('Erro ao cancelar reserva')
      }
    }
  }

  const filteredReservas = reservas.filter(reserva => {
    const livroInfo = getLivroInfo(reserva.livro_id)
    const matchesSearch = reserva.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reserva.usuario_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         livroInfo.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === '' || reserva.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  const isExpirada = (dataExpiracao?: string, status?: string) => {
    return dataExpiracao && status !== 'atendida' && status !== 'cancelada' && isPast(new Date(dataExpiracao))
  }

  // Agrupar reservas por livro para mostrar fila
  const reservasPorLivro = filteredReservas.reduce((acc, reserva) => {
    if (!acc[reserva.livro_id]) {
      acc[reserva.livro_id] = []
    }
    acc[reserva.livro_id].push(reserva)
    return acc
  }, {} as Record<string, Reserva[]>)

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
            <Bookmark className="mr-3 h-8 w-8 text-blue-600" />
            Gerenciamento de Reservas
          </h1>
          <p className="text-gray-600 mt-2">
            Controle de reservas, fila de espera e notificações
          </p>
        </div>
        <button
          onClick={() => { setEditingReserva(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Reserva</span>
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

      {/* Reservas por Livro */}
      <div className="space-y-6">
        {Object.entries(reservasPorLivro).map(([livroId, reservasDoLivro]) => {
          const livroInfo = getLivroInfo(livroId)
          const reservasAtivas = reservasDoLivro.filter(r => r.status === 'ativa' || r.status === 'notificada')
          
          return (
            <div key={livroId} className="bg-white rounded-lg shadow-md border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{livroInfo.titulo}</h3>
                    <p className="text-gray-600">por {livroInfo.autor}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      livroInfo.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {livroInfo.disponivel ? 'Disponível' : 'Indisponível'}
                    </span>
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="text-sm">{reservasAtivas.length} na fila</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {reservasDoLivro
                    .sort((a, b) => (a.prioridade || 999) - (b.prioridade || 999))
                    .map((reserva, index) => {
                      const statusInfo = getStatusInfo(reserva.status)
                      const StatusIcon = statusInfo.icon
                      const expirada = isExpirada(reserva.data_expiracao, reserva.status)
                      
                      return (
                        <div key={reserva._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                              {reserva.prioridade || index + 1}
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900">{reserva.usuario_nome}</h4>
                              <p className="text-sm text-gray-600">{reserva.usuario_email}</p>
                              {reserva.usuario_telefone && (
                                <p className="text-sm text-gray-500">{reserva.usuario_telefone}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                Reservado em: {format(new Date(reserva.data_reserva), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                              {reserva.data_expiracao && (
                                <p className={`text-sm ${expirada ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                  Expira em: {format(new Date(reserva.data_expiracao), 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              )}
                              {reserva.data_notificacao && (
                                <p className="text-sm text-yellow-600">
                                  Notificado em: {format(new Date(reserva.data_notificacao), 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${statusInfo.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="flex space-x-2">
                              {reserva.status === 'ativa' && livroInfo.disponivel && (
                                <button
                                  onClick={() => handleNotificar(reserva)}
                                  className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded text-sm hover:bg-yellow-100 transition-colors flex items-center"
                                >
                                  <Bell className="h-4 w-4 mr-1" />
                                  Notificar
                                </button>
                              )}
                              
                              {(reserva.status === 'notificada' || reserva.status === 'ativa') && (
                                <>
                                  <button
                                    onClick={() => handleAtender(reserva)}
                                    className="bg-green-50 text-green-600 px-3 py-1 rounded text-sm hover:bg-green-100 transition-colors flex items-center"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Atender
                                  </button>
                                  
                                  <button
                                    onClick={() => handleCancelar(reserva)}
                                    className="bg-red-50 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-100 transition-colors flex items-center"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => { setEditingReserva(reserva); setShowForm(true) }}
                                className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100 transition-colors flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </button>
                              
                              <button
                                onClick={() => handleDelete(reserva._id, reserva.usuario_nome)}
                                className="bg-gray-50 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-100 transition-colors flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir
                              </button>
                            </div>
                          </div>

                          {reserva.observacoes && (
                            <div className="mt-2 text-xs text-gray-500 italic">
                              Obs: {reserva.observacoes}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredReservas.length === 0 && (
        <div className="text-center py-12">
          <Bookmark className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma reserva encontrada</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingReserva ? 'Editar Reserva' : 'Nova Reserva'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingReserva(null) }}
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
                      defaultValue={editingReserva?.livro_id || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um livro</option>
                      {livros.map(livro => (
                        <option key={livro._id} value={livro._id}>
                          {livro.titulo} - {livro.autor} {!livro.disponivel && '(Indisponível)'}
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
                      defaultValue={editingReserva?.usuario_nome || ''}
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
                      defaultValue={editingReserva?.usuario_email || ''}
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
                      defaultValue={editingReserva?.usuario_telefone || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data da Reserva *
                    </label>
                    <input
                      name="data_reserva"
                      type="datetime-local"
                      defaultValue={editingReserva ? 
                        format(new Date(editingReserva.data_reserva), "yyyy-MM-dd'T'HH:mm") :
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
                      defaultValue={editingReserva?.status || 'ativa'}
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
                      Prioridade na Fila
                    </label>
                    <input
                      name="prioridade"
                      type="number"
                      min="1"
                      max="10"
                      defaultValue={editingReserva?.prioridade || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    rows={3}
                    defaultValue={editingReserva?.observacoes || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingReserva ? 'Atualizar Reserva' : 'Criar Reserva'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingReserva(null) }}
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

export default Reservas
