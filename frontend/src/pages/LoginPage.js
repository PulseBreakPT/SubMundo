import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/UI';
import { LogIn, UserPlus, Skull } from 'lucide-react';

export default function LoginPage() {
  const { login, register, error, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email obrigatório';
    if (!formData.password) errors.password = 'Password obrigatória';
    if (!isLogin && !formData.username) errors.username = 'Nome de utilizador obrigatório';
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password deve ter pelo menos 6 caracteres';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLogin) {
      await login(formData.email, formData.password);
    } else {
      await register(formData.email, formData.password, formData.username);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background effect */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-surface border border-primary mb-4">
            <Skull size={40} className="text-primary" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-primary tracking-wider">
            SUBMUNDO
          </h1>
          <p className="text-text-secondary text-sm mt-2 font-body">
            O teu império criminal começa aqui
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface border border-border p-6 md:p-8">
          {/* Accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          
          {/* Tabs */}
          <div className="flex mb-6 border-b border-border">
            <button
              className={`flex-1 pb-3 font-ui text-sm uppercase tracking-wider transition-colors ${
                isLogin ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setIsLogin(true)}
              data-testid="login-tab"
            >
              Entrar
            </button>
            <button
              className={`flex-1 pb-3 font-ui text-sm uppercase tracking-wider transition-colors ${
                !isLogin ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setIsLogin(false)}
              data-testid="register-tab"
            >
              Registar
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Nome de utilizador"
                name="username"
                type="text"
                placeholder="CrimeBoss123"
                value={formData.username}
                onChange={handleChange}
                error={formErrors.username}
                data-testid="username-input"
              />
            )}
            
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="crime@submundo.pt"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              data-testid="email-input"
            />
            
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              data-testid="password-input"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={isLogin ? LogIn : UserPlus}
              data-testid="submit-button"
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-text-secondary text-xs mt-6 font-body">
          Ao jogar, aceitas as regras do submundo.
        </p>
      </div>
    </div>
  );
}
