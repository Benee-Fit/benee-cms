# Beneefit HR Portal

To get started, take a look at src/app/page.tsx.

## Environment Variables

- `DATABASE_URL`: The URL of your database.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: The publishable key for Clerk.
- `CLERK_SECRET_KEY`: The secret key for Clerk.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: The sign-in URL for Clerk.
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: The sign-up URL for Clerk.
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`: The URL to redirect to after sign-in.

## Running the Application

To run the application, you can use the following command:

```bash
npm run dev
```

## Deploying the Application

To deploy the application, you can use the following command:

```bash
gcloud builds submit --config=cloudbuild.yaml
```