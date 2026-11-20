import morgan from 'morgan';

morgan.token('path-only', (req) => (req.url ?? '/').split('?')[0]);

export const requestLogger = morgan(':date[iso] :method :path-only :status :response-time ms', {
  skip: (req) => (req.url ?? '').startsWith('/supplier'),
});
