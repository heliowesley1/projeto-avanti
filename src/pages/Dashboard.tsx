import React, { useState, useEffect } from 'react'
import {BookOpen, Users, Calendar, Bookmark, TrendingUp, AlertTriangle, CheckCircle, Clock} from 'lucide-react'
import { livrosApi, emprestimosApi, reservasApi, categoriasApi, autoresApi, 
          Livro, Emprestimo, Reserva, Categoria, Autor } from '../lib/api'

interface DashboardStats {
  totalLivros: number
  livrosDisponiveis: number
  emprestimosAtivos: number
  emprestimosAtrasados: number
  reservasAtivas: number
  totalCategorias: number
  totalAutores: number
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLivros: 0,
    livrosDisponiveis: 0,
    emprestimosAtivos: 0,
    emprestimosAtrasados: 0,
    reservasAtivas: 0,
    totalCategorias: 0,
    totalAutores: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        const [livros, emprestimos, reservas, categorias, autores] = await Promise.all([
          livrosApi.list().catch(() => []),
          emprestimosApi.list().catch(() => []),
          reservasApi.list().catch(() => []),
          categoriasApi.list().catch(() => []),
          autoresApi.list().catch(() => [])
        ]) as [Livro[], Emprestimo[], Reserva[], Categoria[], Autor[]];
        
        const livrosDisponiveis = livros.filter(livro => livro.disponivel).length
        const emprestimosAtivos = emprestimos.filter(emp => emp.status === 'ativo' || emp.status === 'renovado').length
        
        const emprestimosAtrasados = emprestimos.filter(emp => {
          return (emp.status === 'ativo' || emp.status === 'renovado') && new Date(emp.data_devolucao_prevista) < new Date()
        }).length
        
        const reservasAtivas = reservas.filter(res => res.status === 'ativa').length

        setStats({
          totalLivros: livros.length,
          livrosDisponiveis,
          emprestimosAtivos,
          emprestimosAtrasados,
          reservasAtivas,
          totalCategorias: categorias.length,
          totalAutores: autores.length
        })

        const recentEmprestimos = emprestimos
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map(emp => ({
            type: 'emprestimo',
            description: `Empréstimo para ${emp.usuario_nome}`,
            time: emp.createdAt,
            status: (emp.status === 'ativo' || emp.status === 'renovado') && new Date(emp.data_devolucao_prevista) < new Date() ? 'atrasado' : emp.status
          }))

        const recentReservas = reservas
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .map(res => ({
            type: 'reserva',
            description: `Reserva de ${res.usuario_nome}`,
            time: res.createdAt,
            status: res.status
          }))

        setRecentActivity([...recentEmprestimos, ...recentReservas]
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 5))

      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: 'Total de Livros',
      value: stats.totalLivros,
      icon: BookOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Livros Disponíveis',
      value: stats.livrosDisponiveis,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Empréstimos Ativos',
      value: stats.emprestimosAtivos,
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Empréstimos Atrasados',
      value: stats.emprestimosAtrasados,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Reservas Ativas',
      value: stats.reservasAtivas,
      icon: Bookmark,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Categorias',
      value: stats.totalCategorias,
      icon: Users,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'emprestimo':
        return Calendar
      case 'reserva':
        return Bookmark
      default:
        return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
      case 'ativa':
      case 'atendida':
        return 'text-green-600 bg-green-100'
      case 'atrasado':
        return 'text-red-600 bg-red-100'
      case 'notificada':
      case 'renovado':
        return 'text-yellow-600 bg-yellow-100'
      case 'devolvido':
      case 'expirada':
      case 'cancelada':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Dashboard da Biblioteca
        </h1>
        <p className="text-lg text-gray-600">
          Visão geral e estatísticas do sistema em tempo real
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-gray-100`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Stats Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            Resumo do Acervo
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-gray-900">Total de Livros</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.totalLivros}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">Disponíveis</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.livrosDisponiveis}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-orange-600 mr-3" />
                <span className="font-medium text-gray-900">Emprestados</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {stats.totalLivros - stats.livrosDisponiveis}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-purple-600" />
            Atividade Recente
          </h3>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.time).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nenhuma atividade recente
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {stats.emprestimosAtrasados > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Atenção: Empréstimos Atrasados
              </h3>
              <p className="text-red-700">
                Existem {stats.emprestimosAtrasados} empréstimos atrasados que precisam de atenção.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard