import { QueryHookOptions, useQuery } from '@apollo/react-hooks';
import { OperationVariables } from 'apollo-client';
import { DocumentNode } from 'graphql';
import { useCallback } from 'react';
import { getGqlClient } from '../graphql.client';
import { AppCache, defaultStore, RecursivePartial } from '../models/defaultStore';
import { handleError } from '../services/error.service';

/**
 * Use it to wrap functions, e.g. components handlers to add loading and error
 * handling, both synchronous and asynchronous with promise. If an error is thrown
 * and setError is not provided, `handleError` is called instead.
 *
 * If the reference to the handler can change (e.g. arrow notation function), consider wrapping it
 * with useCallback to optimize it.
 *
 * @param handler async function surrounded with try/catch
 * @param setLoading component loading state setter (useState is recommended to generate it)
 * @param setError component error state setter (useState is recommended to generate it)
 */
export function useAsyncHandler(
  handler: (...args: any[]) => Promise<any>,
  setLoading?: (loading: boolean) => void,
  setError?: (error: any) => void) {
  const hasLoadingHandler = arguments.length >= 2 && setLoading;
  const hasErrorHandler = arguments.length >= 3 && setError;
  return useCallback(async (...args: any[]) => {
    if (hasLoadingHandler) setLoading!(true);
    try {
      return await handler(...args);
    } catch (e) {
      if (hasErrorHandler) {
        setError!(e);
      } else {
        handleError(e);
      }
    } finally {
      if (hasLoadingHandler) setLoading!(false);
    }
  }, [handler, hasErrorHandler, hasLoadingHandler, setError, setLoading]);
}

/**
 * Write data to Apollo cache. Cache can be read in components with useQuery hook. The cache
 * should remain the source of truth. To enforce this pattern, its values are immutable. Use
 * writeCache to change their value.
 * @param data The partial to write in cache. If the content added cannot be found in queries or
 * you have a weird error, try to add __typename like what is in defaultStore (should match the
 * type name in localStore.graphql schema).
 * @param id Optional id property used to write a fragment to an existing object in the store.
 */
export function writeCache<TData extends RecursivePartial<AppCache>>(data: TData, id?: string) {
  const gqlClient = getGqlClient();
  addTypeNames(data);
  gqlClient.writeData({ data, id });
}

function addTypeNames<TData extends RecursivePartial<AppCache>>(data: TData) {
  for (const key of Object.keys(data) as (keyof AppCache)[]) {
    const subObj = data[key] as any;
    const initialCacheObj = defaultStore[key] as any;
    if (isObject(subObj) && isObject(initialCacheObj) && !subObj.__typename) {
      subObj.__typename = initialCacheObj.__typename;
    }
  }
  return data;
}

/**
 * Custom hook to read from cache with a slightly improved syntax and typing. The result is not
 * systematically typed with undefined (which does not make sense for local cache and breaks
 * destructuring) but with only the generic type, leaving the type responsibility to the
 * specific model and component.
 * @param query
 * @param options
 */
export function useCache<TData extends AppCache, TVariables = OperationVariables>
(query: DocumentNode, options?: QueryHookOptions<TData, TVariables>): TData {
  const { data, error } = useQuery(query, options);
  if (error) {
    console.error('Error when retrieving cache:', error);
  }
  return data as TData || {};
}

/**
 * Same as useCache but outside components (e.g. services).
 * @param query
 * @param options
 */
export function readCache<TData extends AppCache, TVariables = OperationVariables>
(query: DocumentNode, options?: QueryHookOptions<TData, TVariables>): TData {
  const gqlClient = getGqlClient();
  return gqlClient.readQuery({ query, variables: options?.variables }) as TData;
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return (parts.pop() as string).split(';').shift() || null;
  return null;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

export function isObject(obj: any): boolean {
  return typeof obj === 'object' && obj !== null;
}
