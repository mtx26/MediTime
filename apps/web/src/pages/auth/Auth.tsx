import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import SocialProviders from '@/components/auth/SocialProviders';
import AuthForm from '@/components/auth/AuthForm';

function Auth() {
  const { t } = useTranslation();
  const {
    email, setEmail,
    password, setPassword,
    name, setName,
    passwordVisible, setPasswordVisible,
    activeTab, switchTab,
    redirect,
    lng,
    handleSubmit,
  } = useAuth();

  return (
    <div className="container mx-auto flex justify-center items-center">
      <div className="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={switchTab} className="w-full">
            <TabsList className="mx-auto mb-4 gap-2">
              <TabsTrigger value="login">
                <LogIn className="h-4 w-4" /> {t('auth.login')}
              </TabsTrigger>
              <TabsTrigger value="register">
                <UserPlus className="h-4 w-4" /> {t('auth.register')}
              </TabsTrigger>
            </TabsList>

            <SocialProviders activeTab={activeTab} redirect={redirect} />

            <AuthForm
              activeTab={activeTab}
              lng={lng}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              name={name} setName={setName}
              passwordVisible={passwordVisible} setPasswordVisible={setPasswordVisible}
              handleSubmit={handleSubmit}
            />

            <TabsContent value="login" />
            <TabsContent value="register" />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Auth;
