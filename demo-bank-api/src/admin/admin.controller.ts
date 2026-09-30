import { Controller, Logger, Param, Post } from '@nestjs/common';
import { Audit } from '../common/audit.decorator';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  @Post('customers/:id/limit-override')
  @Audit('admin.limit.override')
  async overrideLimit(@Param('id') customerId: string) {
    return { customerId, limit: 'UNLIMITED' };
  }

  @Post('panels/:panelId/open')
  async openPanel(@Param('panelId') panelId: string) {
    this.logger.log(`Admin panel ${panelId} opened`);
    return { ok: true };
  }
}
