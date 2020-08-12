import { Users } from '@prisma/client';
import * as jose from 'jose';

const key = jose.JWK.asKey('pierre');

export const signJwt = (user: Users) => {
  return jose.JWT.sign(
    {
      'user:email': user.email,
    },
    key,
    {
      audience: user.id,
      expiresIn: '6 hours',
      header: {
        typ: 'JWT',
      },
      issuer: 'https://loud.gg',
    },
  );
};
export const decodeJwt = (jwt: string) => {
  return jose.JWT.verify(jwt, key);
};
