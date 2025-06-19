import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import { SignInContent } from './sign-in-content';

const title = 'Welcome back';
const description = 'Enter your details to sign in.';

export const metadata: Metadata = createMetadata({ title, description });

export default function SignInPage() {
  return <SignInContent title={title} description={description} />;
}
