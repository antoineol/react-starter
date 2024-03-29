import { config as dotEnvConfig, DotenvConfigOptions, parse } from 'dotenv';
import * as fs from 'fs';
import { dotEnvDir } from '../../root';
import MissingEnvVarsError from './missingEnvVarsError';

function difference<T = unknown>(arrA: T[], arrB: T[]) {
  return arrA.filter(a => arrB.indexOf(a) < 0);
}

function maybeRemoveEmpty(obj: object, allowEmptyValues: boolean | string[]) {
  function allowIfEmpty(key: string) {
    return (
      allowEmptyValues === true ||
      (Array.isArray(allowEmptyValues) && allowEmptyValues.includes(key))
    );
  }

  const result = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] || allowIfEmpty(key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

export interface DotenvOptions extends DotenvConfigOptions {
  example?: string;
  sample?: string;
  allowEmptyValues?: boolean | string[];
}

export function config(options: DotenvOptions = {}) {
  const dotenvResult = dotEnvConfig(options);
  const example = options.example || options.sample || '.env.example';
  const allowEmptyValues = options.allowEmptyValues || false;
  const processEnv = maybeRemoveEmpty(process.env, allowEmptyValues);
  const exampleVars = parse(fs.readFileSync(`${dotEnvDir}/${example}`));
  const missing = difference(Object.keys(exampleVars), Object.keys(processEnv));

  if (missing.length > 0) {
    throw new MissingEnvVarsError(
      allowEmptyValues,
      options.path || '.env',
      example,
      missing,
      dotenvResult.error,
    );
  }

  // Key/value pairs defined in example file and resolved from environment
  const required = Object.keys(exampleVars).reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {});
  const error = dotenvResult.error ? { error: dotenvResult.error } : {};
  const result = {
    parsed: dotenvResult.error ? {} : dotenvResult.parsed,
    required,
  };
  return Object.assign(result, error);
}
