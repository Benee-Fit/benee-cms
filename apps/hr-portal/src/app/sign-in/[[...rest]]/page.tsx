import { SignIn } from "@clerk/nextjs";
 
export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sign In to Benee-fit HR Portal</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in to access your HR portal
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-primary hover:bg-primary/90 text-primary-foreground",
              footerActionLink: "text-primary hover:text-primary/90",
            },
          }}
          forceRedirectUrl="/api/auth-redirect"
        />
      </div>
    </div>
  );
}
