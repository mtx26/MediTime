import VerifyEmailForm from '@/components/auth/VerifyEmailForm';

function VerifyEmail() {
  return (
    <div className="container mx-auto flex justify-center items-center my-10">
      <div className="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <VerifyEmailForm />
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
