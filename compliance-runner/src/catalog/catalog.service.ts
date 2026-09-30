import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';

export interface Control {
  id: string;
  title: string;
  method: 'deterministic' | 'hybrid' | 'agent';
  tools: string[];
  enforcement: 'block' | 'review' | 'advisory';
  severity: string;
  regulation?: { source: string; ref: string }[];
}

@Injectable()
export class CatalogService {
  private controls: Control[] = [];

  load(path: string) {
    this.controls = (load(readFileSync(path, 'utf8')) as { controls: Control[] }).controls;
  }

  byTool(tool: string) {
    return this.controls.filter((c) => c.tools.includes(tool));
  }

  all() {
    return this.controls;
  }

  get(id: string) {
    return this.controls.find((c) => c.id === id);
  }
}
