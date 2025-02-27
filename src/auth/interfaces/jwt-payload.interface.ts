export interface JwtPayload {
  username?: string;
  rfc?: string;
  sub: string;
  role: 'admin' | 'client';
}
