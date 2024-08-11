import Joi from 'joi';

export const pluginConfigSchema = Joi.object({
  mode: Joi.string().valid('broadcast', 'warn').default('warn')
}).meta({ className: 'PluginConfig' });
