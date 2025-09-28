import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {BookOpen, Users, Calendar, Bookmark, ArrowRight, BarChart3, Clock, CheckCircle} from 'lucide-react'
import { livrosApi, emprestimosApi, reservasApi, autoresApi, 
          Livro, Emprestimo, Reserva, Autor } from '../lib/api'
import toast from 'react-hot-toast'

interface HomeStats {
  totalLivros: number
  emprestimosAtivos: number
  reservasPendentes: number
  totalAutores: number
}

const Home: React.FC = () => {
  const [stats, setStats] = useState<HomeStats>({
    totalLivros: 0,
    emprestimosAtivos: 0,
    reservasPendentes: 0,
    totalAutores: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        setLoading(true)
        
        const [livros, emprestimos, reservas, autores] = await Promise.all([
          livrosApi.list().catch(() => []),
          emprestimosApi.list().catch(() => []),
          reservasApi.list().catch(() => []),
          autoresApi.list().catch(() => [])
        ]) as [Livro[], Emprestimo[], Reserva[], Autor[]];
        
        const emprestimosAtivos = emprestimos.filter(emp => emp.status === 'ativo' || emp.status === 'renovado').length
        const reservasPendentes = reservas.filter(res => res.status === 'ativa' || res.status === 'notificada').length

        setStats({
          totalLivros: livros.length,
          emprestimosAtivos,
          reservasPendentes,
          totalAutores: autores.length
        })

      } catch (error) {
        console.error('Erro ao carregar estatísticas da Home:', error)
        toast.error('Erro ao carregar estatísticas iniciais.')
      } finally {
        setLoading(false)
      }
    }

    fetchRealStats()
  }, [])
  
  const statCards = [
    { label: 'Livros no Acervo', value: stats.totalLivros, icon: BookOpen, color: 'text-blue-600' },
    { label: 'Empréstimos Ativos', value: stats.emprestimosAtivos, icon: Calendar, color: 'text-green-600' },
    { label: 'Reservas Pendentes', value: stats.reservasPendentes, icon: Bookmark, color: 'text-purple-600' },
    { label: 'Autores Cadastrados', value: stats.totalAutores, icon: Users, color: 'text-orange-600' }
  ]

  const features = [
    {
      icon: BookOpen,
      title: 'Gerenciamento de Acervo',
      description: 'Controle completo do catálogo de livros com informações detalhadas',
      link: '/livros',
      color: 'bg-blue-500'
    },
    {
      icon: Calendar,
      title: 'Controle de Empréstimos',
      description: 'Sistema completo de empréstimos com controle de prazos e multas',
      link: '/emprestimos',
      color: 'bg-green-500'
    },
    {
      icon: Bookmark,
      title: 'Sistema de Reservas',
      description: 'Fila de reservas para livros indisponíveis com notificações',
      link: '/reservas',
      color: 'bg-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analítico',
      description: 'Relatórios e estatísticas detalhadas do funcionamento da biblioteca',
      link: '/dashboard',
      color: 'bg-orange-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Sistema de Biblioteca Digital
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Plataforma completa para gerenciamento de bibliotecas com controle de acervo, 
              empréstimos, reservas e relatórios analíticos em tempo real.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Acessar Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/livros"
              className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Explorar Acervo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section (AGORA COM DADOS REAIS) */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Estatísticas em Tempo Real
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.label}
                      </p>
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.value.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sistema completo com todas as ferramentas necessárias para 
              uma gestão eficiente da sua biblioteca.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${feature.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="flex items-center mt-4 text-blue-600 font-medium group-hover:text-blue-700">
                        Acessar módulo
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/livros"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
            >
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Novo Livro</h3>
              <p className="text-sm text-gray-600">Adicionar livro ao acervo</p>
            </Link>
            
            <Link
              to="/emprestimos"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
            >
              <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Novo Empréstimo</h3>
              <p className="text-sm text-gray-600">Registrar empréstimo</p>
            </Link>
            
            <Link
              to="/reservas"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
            >
              <Clock className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Nova Reserva</h3>
              <p className="text-sm text-gray-600">Criar reserva de livro</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home