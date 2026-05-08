import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  activeTab: string;
  lng: string | undefined;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  passwordVisible: boolean;
  setPasswordVisible: (value: boolean) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function AuthForm({
  activeTab,
  lng,
  email, setEmail,
  password, setPassword,
  name, setName,
  passwordVisible, setPasswordVisible,
  handleSubmit,
}: AuthFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {activeTab === 'register' && (
        <div className="space-y-2">
          <Label htmlFor="name">{t('auth.name')}</Label>
          <Input 
            id="name" 
            type="text" 
            required 
            value={name} 
            autoComplete='name' 
            onChange={(e) => setName(e.target.value)} 
            aria-label={t('auth.name')}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input 
          id="email"
          type="email"
          required value={email}
          autoComplete={activeTab === 'login' ? 'email' : 'new-email'}
          onChange={(e) => setEmail(e.target.value)} 
          aria-label={t('auth.email')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <div className="relative">
          <Input 
            id="password" 
            type={passwordVisible ? 'text' : 'password'} 
            required 
            value={password} 
            autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'} 
            onChange={(e) => setPassword(e.target.value)} 
            aria-label={t('auth.password')}
          />
          <button 
            type="button" 
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" 
            aria-label={passwordVisible ? t('auth.hide_password') : t('auth.show_password')} 
            onClick={() => setPasswordVisible(!passwordVisible)}
          >
            {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {activeTab === 'login' && (
        <div className="text-end">
          <Link to={`/${lng}/reset-password`} className="no-underline hover:underline">
            {t('auth.forgot_password')}
          </Link>
        </div>
      )}

      {activeTab === 'register' && (
        <div className="flex items-start gap-2">
          <Checkbox id="terms" required aria-label={t('auth.accept_terms_aria')} />
          <Label htmlFor="terms" className="cursor-pointer">
            {t('auth.accept_terms')}{' '}
            <Link to={`/${lng}/terms`} className="no-underline hover:underline">
              {t('auth.terms_link')}
            </Link>
          </Label>
        </div>
      )}

      <Button type="submit" variant="outline" className="w-full shadow-sm" aria-label={activeTab === 'login' ? t('auth.login') : t('auth.register')} title={activeTab === 'login' ? t('auth.login') : t('auth.register')}>
        {activeTab === 'login' ? t('auth.login') : t('auth.register')}
      </Button>
    </form>
  );
}

export default AuthForm;
