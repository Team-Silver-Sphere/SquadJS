import winston from 'winston';

export default winston.createLogger({
  level: 'verbose',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.cli())
    }),
    new winston.transports.File({
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      filename: 'squadjs.log'
    })
  ]
});
