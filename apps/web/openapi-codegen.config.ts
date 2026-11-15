// openapi-codegen.config.ts
import { defineConfig } from '@openapi-codegen/cli';
import {
  generateReactQueryComponents,
  generateSchemaTypes,
} from '@openapi-codegen/typescript';
import config from 'dotenv';
config.config();

export default defineConfig({
  viewb: {
    from: {
      source: 'url',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/openapi.json`,
      method: 'get',
      //   headers: {
      //     Authorization: `Basic ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
      //   },
    },
    outputDir: 'services',
    to: async (context: any) => {
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenameCase: 'kebab',
        filenamePrefix: 'types.',
      });

      await generateReactQueryComponents(context, {
        filenameCase: 'kebab',
        filenamePrefix: 'queries.',
        useEnums: true,
        schemasFiles,
      });
    },
  },
});
