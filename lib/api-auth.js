const API_SECRET = process.env.API_SECRET || 'INTELLIFLOW_OPS_2026';

export function validateRequest(req) {
  const provided = req.headers['x-api-secret'];
  if (!provided || provided !== API_SECRET) {
    return { valid: false, error: 'Unauthorized' };
  }
  return { valid: true };
}
