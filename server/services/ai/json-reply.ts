// Small helpers for reading a model's JSON answer. No SDK imports, so tests can load it.

/** If the model nested the answer under one generic key ({"response": {...}}), take the inner object. */
export function unwrap(input: unknown): unknown {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const keys = Object.keys(input);
    const only = keys.length === 1 ? (input as Record<string, unknown>)[keys[0]] : undefined;
    if (only && typeof only === 'object' && !Array.isArray(only) && /^(input|response|result|answer|output|json|data)$/i.test(keys[0])) return only;
  }
  return input;
}
