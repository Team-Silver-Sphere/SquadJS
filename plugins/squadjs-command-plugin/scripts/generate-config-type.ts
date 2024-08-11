import fs from 'fs';
import joiToTypescript from 'joi-to-typescript';

// Define constants.
const SCHEMA_DIRECTORY: string = './src/plugin-config/schema';
const TYPE_DIRECTORY: string = './src/plugin-config/types';

// Generate the types.
(async () => {
  // Delete the existing types.
  fs.rmSync(TYPE_DIRECTORY, { recursive: true, force: true });

  await joiToTypescript.convertFromDirectory({
    schemaDirectory: SCHEMA_DIRECTORY,
    typeOutputDirectory: TYPE_DIRECTORY
  });
})();
