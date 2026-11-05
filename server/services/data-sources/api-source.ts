import { inferColumns, registerDataset, type Dataset } from './dataset-registry';
import { safeFetch } from '../integrations/safe-fetch';

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

function jsonToRows(data: any): Record<string, any>[] {
  if (Array.isArray(data)) {
    return data.map(item =>
      typeof item === 'object' && item !== null ? flattenObject(item) : { value: item }
    );
  }

  if (typeof data === 'object' && data !== null) {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === 'object') {
        return data[key].map((item: any) => flattenObject(item));
      }
    }
    return [flattenObject(data)];
  }

  return [{ value: data }];
}

export async function fetchApiData(
  url: string,
  method: string = 'GET',
  headers: Record<string, string> = {}
): Promise<{ success: boolean; data?: Dataset; error?: string; preview?: any }> {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'Invalid URL. Must start with http:// or https://' };
  }

  try {
    const response = await safeFetch(url, {
      method: method.toUpperCase() === 'POST' ? 'POST' : 'GET',
      headers,
    });

    if (response.status < 200 || response.status >= 300) {
      return { success: false, error: `API returned HTTP ${response.status}: ${response.statusText}` };
    }

    if (!response.contentType.includes('json')) {
      return {
        success: false,
        error: `Expected JSON response but received ${response.contentType || 'no content type'}. Response preview: ${response.body.slice(0, 200)}`
      };
    }

    let json: any;
    try { json = JSON.parse(response.body); } catch { return { success: false, error: 'The response said it was JSON but could not be read.' }; }
    const rows = jsonToRows(json);

    if (rows.length === 0) {
      return { success: false, error: 'API response contained no usable data rows.' };
    }

    const columns = inferColumns(rows);
    const dataset = registerDataset({
      name: `API Import ${new URL(url).hostname}`,
      source_type: 'api',
      columns,
      rows,
      source_meta: { url, method }
    });

    return { success: true, data: dataset, preview: rows.slice(0, 3) };
  } catch (err: any) {
    return { success: false, error: `Failed to fetch API: ${err.message}` };
  }
}