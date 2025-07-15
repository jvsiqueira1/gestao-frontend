"use client";
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, PieChart, BarChart3, Shield, Clock, Smartphone, DollarSign, Target, Zap, ArrowDown, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Redirecionar usuários logados para o dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Parallax effect on mousemove
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const els = containerRef.current.querySelectorAll('.parallax-element');
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      els.forEach(el => {
        const speed = parseFloat((el as HTMLElement).dataset.speed || '0');
        const xOffset = (x - 0.5) * speed;
        const yOffset = (y - 0.5) * speed;
        (el as HTMLElement).style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Se o usuário está logado, não renderizar a página inicial
  if (user) {
    return null;
  }

  const features = [
    {
      icon: TrendingUp,
      title: 'Controle Inteligente',
      description: 'Monitore suas receitas e despesas com análises detalhadas e insights automáticos.'
    },
    {
      icon: PieChart,
      title: 'Relatórios Visuais',
      description: 'Visualize seus dados financeiros através de gráficos interativos e relatórios personalizados.'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Seus dados estão protegidos com criptografia de ponta e backup automático.'
    },
    {
      icon: Clock,
      title: 'Tempo Real',
      description: 'Atualizações instantâneas e sincronização em todos os seus dispositivos.'
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Interface responsiva que funciona perfeitamente em qualquer dispositivo.'
    },
    {
      icon: BarChart3,
      title: 'Planejamento Financeiro',
      description: 'Controle seus orçamentos para alcançar seus objetivos com facilidade.'
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: 'Economia Inteligente',
      description: 'Identifique padrões de gastos e descubra oportunidades de economia.'
    },
    {
      icon: Target,
      title: 'Metas Financeiras',
      description: 'Defina e acompanhe suas metas financeiras com ferramentas especializadas.'
    },
    {
      icon: Zap,
      title: 'Decisões Rápidas',
      description: 'Tome decisões financeiras informadas com dados em tempo real.'
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full overflow-x-hidden flex flex-col items-center bg-background text-foreground"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="parallax-element absolute top-20 left-[10%] w-64 h-64 rounded-full bg-cyan-200/30 dark:bg-cyan-900/30 blur-3xl"
          data-speed="30"
        />
        <div 
          className="parallax-element absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-cyan-300/20 dark:bg-cyan-800/20 blur-3xl"
          data-speed="20"
        />
        <div 
          className="parallax-element absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-cyan-100/40 dark:bg-cyan-900/40 blur-2xl"
          data-speed="15"
        />
      </div>
      
      {/* Navigation */}
      <nav className="relative z-20 container mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Gestão de Gastos</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <ThemeToggle />
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link 
              href="/register" 
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="container relative z-10 min-h-screen flex flex-col justify-center">
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-block bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-cyan-200 dark:border-cyan-700"
          >
            <Sparkles className="inline w-4 h-4 mr-1 align-text-bottom" /> Simplifique suas finanças
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
          >
            Domine suas finanças
            <br />
            <span className="text-cyan-500">com inteligência</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed"
          >
            Controle despesas e rendas com uma interface intuitiva. Visualize seus dados financeiros, tome decisões inteligentes e alcance seus objetivos.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 mb-12"
          >
            <Link 
              href="/register"
              className="inline-flex items-center justify-center bg-cyan-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl hover:bg-cyan-600 transition-all duration-300"
            >
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/login"
              className="inline-flex items-center justify-center bg-background text-foreground px-8 py-4 rounded-full text-lg font-semibold border-2 border-border hover:border-muted-foreground transition-all duration-300"
            >
              Já tenho conta
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-card border border-border"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
            <div className="bg-gradient-to-br from-background to-muted p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">R$ 5.240</div>
                  <div className="text-sm text-muted-foreground">Receitas do Mês</div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">R$ 3.120</div>
                  <div className="text-sm text-muted-foreground">Despesas do Mês</div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-cyan-500">R$ 2.120</div>
                  <div className="text-sm text-muted-foreground">Saldo</div>
                </div>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <div className="text-sm text-muted-foreground mb-2">Gráfico de Despesas por Categoria</div>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-red-400/40 rounded h-8"></div>
                  <div className="flex-1 bg-cyan-400/40 rounded h-6"></div>
                  <div className="flex-1 bg-green-400/40 rounded h-10"></div>
                  <div className="flex-1 bg-cyan-400/40 rounded h-4"></div>
                  <div className="flex-1 bg-purple-400/40 rounded h-7"></div>
                </div>
              </div>
            </div>
          </motion.div>
          {/* Seta para baixo indicando rolagem */}
          <div className="flex justify-center mt-8">
            <span className="animate-bounce text-cyan-500">
              <ArrowDown className="w-8 h-8" />
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container relative z-10 py-20">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
          >
            Tudo que você precisa para suas finanças
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Ferramentas poderosas e intuitivas para você ter controle total sobre seu dinheiro
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="h-full bg-card text-card-foreground border border-border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6">
                <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center mb-4 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 w-full bg-muted">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
            >
              Por que escolher o Gestão de Gastos?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Descubra como nossa plataforma pode transformar sua relação com o dinheiro
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container relative z-10 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl p-12 text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comece a controlar suas finanças hoje
            </h2>
            <p className="text-xl mb-8 text-white">
              Junte-se a milhares de usuários que já transformaram suas finanças
            </p>
            <Link 
              href="/register"
              className="inline-flex items-center justify-center bg-white text-cyan-500 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300"
            >
              Criar conta gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="text-sm text-white/80 mt-4">
              7 dias de teste gratuito • Sem cartão de crédito
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background text-foreground py-12 w-full">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Gestão de Gastos</span>
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Entrar
              </Link>
              <Link 
                href="/register" 
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground w-full">
            <p>&copy; {new Date().getFullYear()} <a href="https://www.linkedin.com/in/joaovitorsiqueira1/" target='_blank' className='hover:underline'>Gestão de Gastos</a>. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
