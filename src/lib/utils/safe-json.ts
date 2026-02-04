export async function readJsonResponse<T = unknown>(response: Response): Promise<{
  data: T | null;
  text: string;
}> {
  const text = await response.text();
  if (!text) {
    return { data: null, text: "" };
  }
  try {
    return { data: JSON.parse(text) as T, text };
  } catch {
    return { data: null, text };
  }
}
