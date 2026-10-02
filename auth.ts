import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email as string } 
        });
        
        if (!user) return null;
        
        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;
        
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          preferences: user.preferences
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.preferences = (user as any).preferences;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (session.user) {
          session.user.id = token.id as string;
          (session.user as any).role = token.role as string;
          (session.user as any).preferences = token.preferences as string | null;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Optional custom login page
  }
});
