import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUp
        appearance={{
          elements: {
            card: 'shadow-lg rounded-lg',
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
          },
        }}
        afterSignUpUrl="/"
        redirectUrl="/"
      />
    </div>
  );
}
