export type Role = 'admin' | 'usuario';

export interface IAuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
}
