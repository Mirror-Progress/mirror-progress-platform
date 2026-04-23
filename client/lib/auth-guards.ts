import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { findAccountById, isAdminRole, type StoredAccount } from './accounts';
import { getSessionUserFromCookieHeader, getSessionUserFromRequest } from './session';

export async function getAuthenticatedAccountFromRequest(req: NextApiRequest) {
  const sessionUser = getSessionUserFromRequest(req);

  if (!sessionUser) {
    return null;
  }

  return findAccountById(sessionUser.id);
}

export async function requireAdminApiAccount(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const account = await getAuthenticatedAccountFromRequest(req);

  if (!account) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }

  if (!isAdminRole(account.role)) {
    res.status(403).json({ error: 'Admin access required.' });
    return null;
  }

  if (account.status !== 'active') {
    res.status(403).json({ error: 'Account access is disabled.' });
    return null;
  }

  return account;
}

export async function getSessionAccountFromContext(
  context: GetServerSidePropsContext
) {
  const sessionUser = getSessionUserFromCookieHeader(context.req.headers.cookie);

  if (!sessionUser) {
    return null;
  }

  return findAccountById(sessionUser.id);
}

export async function requireAdminPageAccess<T>(
  context: GetServerSidePropsContext
): Promise<
  | { account: StoredAccount; redirect?: undefined }
  | { account?: undefined; redirect: GetServerSidePropsResult<T> }
> {
  const account = await getSessionAccountFromContext(context);

  if (!account) {
    return {
      redirect: {
        redirect: {
          destination: '/?auth=login&next=/admin',
          permanent: false,
        },
      },
    };
  }

  if (!isAdminRole(account.role) || account.status !== 'active') {
    return {
      redirect: {
        redirect: {
          destination: '/workspace',
          permanent: false,
        },
      },
    };
  }

  return { account };
}
