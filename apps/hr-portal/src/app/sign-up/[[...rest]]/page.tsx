import { SignUp } from "@clerk/nextjs";
 
export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sign Up for Benee-fit HR Portal</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create an account to access your HR portal
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-primary hover:bg-primary/90 text-primary-foreground",
              footerActionLink: "text-primary hover:text-primary/90",
            },
          }}
          redirectUrl="/"
        />
      </div>
    </div>
  );
}
