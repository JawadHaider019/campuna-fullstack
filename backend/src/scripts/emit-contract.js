import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import config from '../../prisma.config.js';
import * as framework from '@prisma/orm-framework/components';

async function emitContract() {
  const orm = config.orm;
  const components = [orm.family, orm.target, orm.adapter, orm.driver, ...(orm.extensions || [])];
  
  const authoringContributions = framework.assembleAuthoringContributions(components);
  const controlMutationDefaults = framework.assembleControlMutationDefaults(components);
  const codecLookup = framework.extractCodecLookup(components);
  const capabilities = framework.mergeCapabilityMatrices(orm.family, [orm.target, orm.adapter, orm.driver, ...(orm.extensions || [])]);
  
  const contractPrismaPath = path.resolve(process.cwd(), 'src/prisma/contract.prisma');
  const contractJsonPath = path.resolve(process.cwd(), 'src/prisma/contract.json');

  const context = {
    resolvedInputs: [contractPrismaPath],
    authoringContributions,
    controlMutationDefaults,
    codecLookup,
    capabilities,
    composedExtensions: [],
    composedExtensionContracts: {}
  };

  console.log('🔄 Compiling contract from', contractPrismaPath, '...');
  const loaded = await orm.contract.source.load(context);

  if (loaded.ok) {
    fs.writeFileSync(contractJsonPath, JSON.stringify(loaded.value, null, 2), 'utf-8');
    console.log('✅ contract.json emitted successfully at', contractJsonPath);
  } else {
    console.error('❌ Failed to compile contract:', loaded._failure || loaded.error);
    process.exit(1);
  }
}

emitContract().catch((err) => {
  console.error('❌ Error during contract emit:', err);
  process.exit(1);
});
