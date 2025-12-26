import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; 
 import { 
  User, Mail, Lock, Eye, EyeOff, Crosshair, Target, 
  CheckCircle, XCircle, Loader2, AlertCircle, Shield,
  ArrowRight, Heart, Sparkles, Bug, AlertTriangle
} from 'lucide-react';

// Componentes UI simplificados
const Button = ({ children, className, disabled, ...props }) => (
  <button 
    className={`px-4 py-2 rounded-md transition-all duration-300 ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
    } ${className}`}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className, error, success, ...props }) => (
  <input 
    className={`border rounded-lg px-4 py-3 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300 ${
      error 
        ? 'border-red-500 focus:ring-red-500 bg-red-900/10' 
        : success
        ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-900/10'
        : 'border-emerald-500/40 focus:ring-emerald-500 bg-slate-900/40'
    } ${className}`}
    {...props} 
  />
);

const Label = ({ children, className, ...props }) => (
  <label className={`block text-sm font-semibold mb-2 tracking-wide ${className}`} {...props}>
    {children}
  </label>
);

const Card = ({ children, className, ...props }) => (
  <div className={`rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className, ...props }) => (
  <div className={`p-8 ${className}`} {...props}>
    {children}
  </div>
);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false); // Começa com REGISTRO obrigatório
  const [showPassword, setShowPassword] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const { register, login, checkEmail, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  // VERIFICAR EMAIL EM TEMPO REAL
  useEffect(() => {
    const verifyEmail = async () => {
      if (!formData.email || formData.email.length < 3) {
        setEmailChecked(false);
        return;
      }

      // Aguardar digitação
      const timer = setTimeout(async () => {
        setCheckingEmail(true);
        try {
          const exists = await checkEmail(formData.email);
          setEmailAvailable(!exists);
          setEmailChecked(true);
          
          if (exists && !isLogin) {
            setErrors(prev => ({
              ...prev,
              email: 'Este e-mail já está registrado. Faça login.'
            }));
          } else if (errors.email && !exists) {
            // Limpar erro se email estiver disponível
            setErrors(prev => ({ ...prev, email: '' }));
          }
        } catch (error) {
          console.error('Erro ao verificar email:', error);
        } finally {
          setCheckingEmail(false);
        }
      }, 800);

      return () => clearTimeout(timer);
    };

    verifyEmail();
  }, [formData.email, isLogin, checkEmail]);

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Nome é obrigatório';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    } else if (!isLogin && emailChecked && !emailAvailable) {
      newErrors.email = 'Este e-mail já está registrado. Faça login.';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Use letras e números';
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirme sua senha';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'As senhas não coincidem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    if (!validateForm()) {
      return;
    }

    setMessage({ type: '', text: '' });

    if (isLogin) {
      // LOGIN - só funciona se usuário estiver REGISTRADO
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: '✅ Login realizado! Redirecionando para o jogo...' 
        });

        navigate('/home');
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ ${result.error}` 
        });
      }
    } else {
      // REGISTRO - obrigatório para criar conta
      const result = await register(formData);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: '🎉 Conta criada com sucesso! Faça login para acessar o jogo.' 
        });
        
        // Limpar formulário
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        setFormSubmitted(false);
        
        // Mudar para tela de login automaticamente após 3 segundos
        setTimeout(() => {
          setIsLogin(true);
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ ${result.error}` 
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Limpar mensagem do sistema
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  // Resetar formulário ao alternar entre login/registro
  const handleToggle = (isLoginMode) => {
    setIsLogin(isLoginMode);
    setFormSubmitted(false);
    setErrors({});
    setMessage({ type: '', text: '' });
    if (!isLoginMode) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background - virus particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 80 + 20,
              height: Math.random() * 80 + 20,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${
                ['rgba(34, 197, 94, 0.15)', 'rgba(234, 179, 8, 0.1)', 'rgba(239, 68, 68, 0.1)', 'rgba(168, 85, 247, 0.1)'][Math.floor(Math.random() * 4)]
              } 0%, transparent 70%)`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.4, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Crosshair decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`crosshair-${i}`}
            className="absolute text-emerald-500/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Crosshair size={Math.random() * 50 + 30} />
          </motion.div>
        ))}
      </div>

      {/* Floating cells */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`cell-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 40 - 20],
              x: [0, Math.random() * 40 - 20],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <div className={`rounded-full ${i % 3 === 0 ? 'bg-emerald-500/10' : i % 3 === 1 ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}
              style={{
                width: Math.random() * 30 + 10,
                height: Math.random() * 30 + 10,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-emerald-400/5"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              x: [0, Math.random() * 100 - 50],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo e título */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
            className="mb-6"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 15, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-28 h-28 border-2 border-dashed border-emerald-500/20 rounded-full" />
              </motion.div>
              <Target className="w-24 h-24 text-emerald-400 mx-auto" strokeWidth={1.5} />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-300 mb-3 tracking-tighter"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            VIRUS HUNTER
          </motion.h1>
          
          <motion.p 
            className="text-emerald-200/80 text-lg mb-2 font-light tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isLogin ? 'Defesa Celular Ativada' : 'Junte-se à Defesa'}
          </motion.p>
          
          <motion.div 
            className="flex items-center justify-center space-x-4 text-emerald-300/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>Sistema Imune</span>
            </div>
            <div className="w-1 h-1 bg-emerald-500/30 rounded-full"></div>
            <div className="flex items-center">
              <Bug className="w-4 h-4 mr-1" />
              <span>Epidemiologia</span>
            </div>
            <div className="w-1 h-1 bg-emerald-500/30 rounded-full"></div>
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              <span>Jogo Educativo</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Banner informativo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className={`p-4 rounded-xl border backdrop-blur-sm ${
            isLogin 
              ? 'bg-emerald-900/20 border-emerald-500/40' 
              : 'bg-blue-900/20 border-blue-500/40'
          }`}>
            <div className="flex items-start">
              <div className={`p-2 rounded-lg mr-3 ${
                isLogin ? 'bg-emerald-500/20' : 'bg-blue-500/20'
              }`}>
                {isLogin ? (
                  <Shield className="w-5 h-5 text-emerald-400" />
                ) : (
                  <User className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-white mb-1">
                  {isLogin ? '🔐 Acesso ao Jogo' : '📝 Registro Obrigatório'}
                </p>
                <p className="text-sm text-white/70">
                  {isLogin 
                    ? 'Faça login para acessar o simulador de defesa celular'
                    : 'Crie sua conta para começar a jornada científica'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mensagens do sistema */}
        {message.text && (
          <motion.div
            key={message.text}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
              message.type === 'success' 
                ? 'bg-emerald-900/40 border-emerald-500/60' 
                : 'bg-red-900/40 border-red-500/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 p-2 rounded-full ${
                message.type === 'success' 
                  ? 'bg-emerald-500/20' 
                  : 'bg-red-500/20'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  message.type === 'success' ? 'text-emerald-100' : 'text-red-100'
                }`}>
                  {message.text}
                </p>
                {message.type === 'success' && isLogin && (
                  <p className="text-xs text-emerald-200/60 mt-1">
                    Redirecionando em instantes...
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Card principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent>
              {/* Toggle Login/Registro */}
              <div className="flex bg-slate-950/60 border border-emerald-500/20 rounded-xl p-1.5 mb-8">
                <button
                  onClick={() => handleToggle(false)}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                    !isLogin 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-emerald-200/70 hover:text-emerald-100 hover:bg-slate-800/50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Registrar
                </button>
                
                <button
                  onClick={() => handleToggle(true)}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                    isLogin 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-emerald-200/70 hover:text-emerald-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Entrar
                </button>
              </div>

              {/* Título do formulário */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  {isLogin ? 'Acesso ao Sistema' : 'Criar Nova Conta'}
                </h2>
                <p className="text-emerald-200/60 text-center text-sm">
                  {isLogin 
                    ? 'Entre com suas credenciais registradas'
                    : 'Preencha os dados para criar sua conta'
                  }
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Campo Nome (apenas registro) */}
                {!isLogin && (
                  <div>
                    <Label htmlFor="name" className="text-white mb-3">
                      <div className="flex items-center justify-between">
                        <span>Nome do Defensor</span>
                        <span className="text-xs font-normal text-emerald-300/60">Obrigatório</span>
                      </div>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <User className="w-5 h-5 text-emerald-500/60" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={formData.name}
                        onChange={handleChange}
                        error={!!errors.name}
                        success={formData.name && !errors.name}
                        disabled={loading}
                        className="pl-12 pr-4 py-3 h-14 text-lg"
                      />
                      {formData.name && !errors.name && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                    </div>
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                    {formData.name && !errors.name && (
                      <p className="text-emerald-400 text-xs mt-2">
                        ✓ Nome válido
                      </p>
                    )}
                  </div>
                )}

                {/* Campo Email */}
                <div>
                  <Label htmlFor="email" className="text-white mb-3">
                    <div className="flex items-center justify-between">
                      <span>Endereço de E-mail</span>
                      <span className="text-xs font-normal text-emerald-300/60">Obrigatório</span>
                    </div>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Mail className="w-5 h-5 text-emerald-500/60" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="exemplo@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      success={formData.email && !errors.email && emailChecked && emailAvailable}
                      disabled={loading}
                      className="pl-12 pr-12 py-3 h-14 text-lg"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                      {checkingEmail ? (
                        <Loader2 className="w-5 h-5 text-emerald-500/60 animate-spin" />
                      ) : formData.email && !errors.email && emailChecked ? (
                        emailAvailable ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )
                      ) : null}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    {errors.email ? (
                      <p className="text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    ) : formData.email && emailChecked ? (
                      <p className={`text-xs flex items-center gap-2 ${
                        emailAvailable ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {emailAvailable ? '✓ Disponível para registro' : '✗ E-mail já registrado'}
                      </p>
                    ) : formData.email ? (
                      <p className="text-emerald-300/50 text-xs">Verificando disponibilidade...</p>
                    ) : null}
                    
                    {!isLogin && formData.email && emailChecked && emailAvailable && (
                      <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                        ✓ Pode registrar
                      </span>
                    )}
                  </div>
                </div>

                {/* Campo Senha */}
                <div>
                  <Label htmlFor="password" className="text-white mb-3">
                    <div className="flex items-center justify-between">
                      <span>Senha</span>
                      <span className="text-xs font-normal text-emerald-300/60">Mínimo 6 caracteres</span>
                    </div>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-5 h-5 text-emerald-500/60" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      error={!!errors.password}
                      success={formData.password && !errors.password}
                      disabled={loading}
                      className="pl-12 pr-12 py-3 h-14 text-lg tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/60 hover:text-emerald-400 transition-colors disabled:hover:text-emerald-500/60"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                  {formData.password && !errors.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-1 flex-1 rounded-full ${
                          formData.password.length >= 6 ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}></div>
                        <div className={`h-1 flex-1 rounded-full ${
                          formData.password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}></div>
                        <div className={`h-1 flex-1 rounded-full ${
                          /(?=.*[A-Za-z])(?=.*\d)/.test(formData.password) ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}></div>
                      </div>
                      <p className="text-emerald-400 text-xs">✓ Senha segura</p>
                    </div>
                  )}
                </div>

                {/* Campo Confirmar Senha (apenas registro) */}
                {!isLogin && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-white mb-3">
                      <div className="flex items-center justify-between">
                        <span>Confirmar Senha</span>
                        <span className="text-xs font-normal text-emerald-300/60">Obrigatório</span>
                      </div>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Lock className="w-5 h-5 text-emerald-500/60" />
                      </div>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite a senha novamente"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={!!errors.confirmPassword}
                        success={formData.confirmPassword && !errors.confirmPassword}
                        disabled={loading}
                        className="pl-12 pr-4 py-3 h-14 text-lg tracking-widest"
                      />
                      {formData.confirmPassword && !errors.confirmPassword && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                    {formData.confirmPassword && !errors.confirmPassword && (
                      <p className="text-emerald-400 text-xs mt-2">
                        ✓ Senhas coincidem
                      </p>
                    )}
                  </div>
                )}

                {/* Botão de submit */}
                <motion.div
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="pt-4"
                >
                  <Button 
                    type="submit"
                    disabled={
                      loading || 
                      (!isLogin && emailChecked && !emailAvailable) ||
                      (formSubmitted && Object.keys(errors).length > 0)
                    }
                    className="w-full h-16 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 border-0 flex items-center justify-center gap-3 group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>{isLogin ? 'Autenticando...' : 'Registrando...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isLogin ? ' Entrar no Jogo' : ' Criar Minha Conta'}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  
                  {/* Informações de segurança */}
                  <div className="mt-4 text-center">
                    <p className="text-emerald-200/40 text-xs">
                      {isLogin 
                        ? 'As credenciais são verificadas no banco de dados'
                        : 'Seus dados são armazenados com segurança'
                      }
                    </p>
                  </div>
                </motion.div>
              </form>

              {/* Separador */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-emerald-500/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-gradient-to-br from-slate-900 to-slate-950 text-emerald-200/60 text-sm">
                    {isLogin ? 'Precisa de ajuda?' : 'Já possui conta?'}
                  </span>
                </div>
              </div>

              {/* Ações alternativas */}
              <div className="text-center">
                <button
                  onClick={() => handleToggle(!isLogin)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-medium transition-colors"
                >
                  {isLogin 
                    ? 'Não tem conta? Registre-se aqui'
                    : 'Já tem conta? Faça login aqui'
                  }
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                {isLogin && (
                  <p className="mt-4 text-emerald-200/50 text-sm">
                    Esqueceu a senha?{' '}
                    <button className="text-emerald-300 hover:text-emerald-200 font-medium">
                      Recuperar acesso
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer info */}
        <motion.div 
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center justify-center space-x-6 text-emerald-200/40 text-sm mb-3">
            <span>Supabase PostgreSQL</span>
            <div className="w-1 h-1 bg-emerald-500/30 rounded-full"></div>
            <span>Autenticação Segura</span>
            <div className="w-1 h-1 bg-emerald-500/30 rounded-full"></div>
            <span>Dados Criptografados</span>
          </div>
          
          <p className="text-emerald-200/30 text-xs tracking-widest uppercase mb-1">
            Vírus Hunter • Sistema Educacional
          </p>
          <p className="text-emerald-200/20 text-xs">
            Universidade Federal do Amazonas • PIBIC/PAIC 2025-2026
          </p>
        </motion.div>
      </div>

      {/* Bottom gradient overlay */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-slate-950 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      />

      {/* Top gradient overlay */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-slate-950 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      />
    </div>
  );
}