import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';

export default async function KeystaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    redirect('/login');
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      redirect('/');
    }
  } catch {
    redirect('/login');
  }

  return <>{children}</>;
}
