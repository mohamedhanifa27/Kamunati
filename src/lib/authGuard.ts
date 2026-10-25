// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
import { NextResponse } from 'next/server';
import { auth } from '../../auth';

export interface GuardSession {
  user: {
    id: string;
    email?: string | null;
    role?: string | null;
    preferences?: string | null;
  };
}

export async function requireAdminSession(): Promise<{
  errorResponse: NextResponse | null;
  session: GuardSession | null;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        ),
        session: null
      };
    }

    const role = (session.user as any)?.role;
    if (role !== 'ADMIN') {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        ),
        session: null
      };
    }

    return { errorResponse: null, session: session as unknown as GuardSession };
  } catch (err: any) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Authentication verification failure' },
        { status: 500 }
      ),
      session: null
    };
  }
}

export async function requireUserSession(): Promise<{
  errorResponse: NextResponse | null;
  session: GuardSession | null;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        ),
        session: null
      };
    }

    return { errorResponse: null, session: session as unknown as GuardSession };
  } catch (err: any) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Authentication verification failure' },
        { status: 500 }
      ),
      session: null
    };
  }
}
