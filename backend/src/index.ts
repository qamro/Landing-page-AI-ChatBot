import app from './app';
import logger from './lib/logger';
import config from './config';

const port = config.PORT || 4000;

app.listen(port, () => {
  logger.info(`Server running on port ${port} — env=${config.NODE_ENV}`);
});
