import { Module } from '@nestjs/common';
import { CatalogService } from './catalog/catalog.service.js';
import { GitleaksAdapter } from './adapters/gitleaks.adapter.js';
import { TrivyAdapter } from './adapters/trivy.adapter.js';
import { SemgrepAdapter } from './adapters/semgrep.adapter.js';
import { CheckovAdapter } from './adapters/checkov.adapter.js';
import { ConftestAdapter } from './adapters/conftest.adapter.js';
import { PiiAgent } from './agents/pii.agent.js';
import { TOOL_ADAPTERS, ToolAdapter } from './adapters/tool-adapter.js';
import { RunnerService } from './runner/runner.service.js';

const ADAPTERS = [GitleaksAdapter, TrivyAdapter, SemgrepAdapter, CheckovAdapter, ConftestAdapter, PiiAgent];

@Module({
  providers: [
    CatalogService,
    ...ADAPTERS,
    {
      provide: TOOL_ADAPTERS,
      useFactory: (...adapters: ToolAdapter[]) => adapters,
      inject: ADAPTERS,
    },
    RunnerService,
  ],
})
export class AppModule {}
